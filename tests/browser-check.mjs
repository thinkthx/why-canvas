// Optional development harness. Supply a locally installed playwright module.
import {readFileSync, mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
const {chromium, webkit} = await import(process.env.WHY_CANVAS_PLAYWRIGHT || 'playwright');
const engine = process.env.WHY_CANVAS_BROWSER === 'webkit' ? webkit : chromium;
const browser = await engine.launch({headless:true,...(engine===chromium && process.env.PLAYWRIGHT_EXECUTABLE_PATH ? {executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH}:{} )});
const html=readFileSync(new URL('../why-canvas.html',import.meta.url),'utf8');
const origin='http://canvas.test';
const errors=[], external=[];
const phase=process.env.WHY_CANVAS_PHASE || 'all';
const evidence=process.env.WHY_CANVAS_EVIDENCE;
if(evidence)mkdirSync(evidence,{recursive:true});
async function context(options={}) {
  const ctx=await browser.newContext({viewport:{width:1920,height:1080},reducedMotion:'reduce',...options});
  await ctx.route('**/*',async route=>{
    if(new URL(route.request().url()).origin!==origin){external.push(route.request().url());return route.abort();}
    return route.fulfill({contentType:'text/html',body:html});
  });
  ctx.on('page',p=>{p.setDefaultTimeout(8000);p.on('pageerror',e=>errors.push(e.message));});
  // Exercise the windowed fallback deterministically; native fullscreen is checked separately.
  await ctx.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(new Error('Windowed fallback'));});
  return ctx;
}
async function seed(page,texts,{anonymise=false,empty=false,type='team'}={}) {
  await page.goto(origin+'/why-canvas.html');
  await page.evaluate(({texts,anonymise,empty,type})=>{
    const settings={type,group:'Workshop',view:'facilitator'};
    const replies=Object.fromEntries(texts.map((text,i)=>{
      const name=`Person ${String(i+1).padStart(2,'0')}`;
      return [WhyCanvas.nameKey(name),{name,type,group:'Workshop',updated:'2026-10-20T00:00:00Z',answers:empty?{}:{
        'hero.primary':text,'villain.name':`Obstacle ${i+1}`,'purpose.hero':'people','purpose.problem':'confusion',
        'purpose.villain':'competing priorities','purpose.change':'clear direction','purpose.what':'working together',
      }}];
    }));
    const highlights={[WhyCanvas.highlightKey('Person 01','hero.primary')]:{star:true,tag:'agree'}};
    localStorage.setItem(WhyCanvas.storageKey(settings,'facilitator'),JSON.stringify({replies,highlights,anonymise,seed:42}));
    location.hash=WhyCanvas.settingsHash(settings);
  },{texts,anonymise,empty,type});
  await page.locator('#present').waitFor();
}
async function storage(page){return page.evaluate(()=>JSON.stringify({...localStorage}));}
try {
  if(['all','presenter'].includes(phase)) {
    const ctx=await context(); const page=await ctx.newPage();
    for(const count of [1,6,7,10,12]) {
      const texts=Array.from({length:count},(_,i)=>`Reply ${i+1}: Help people find direction.`);
      await seed(page,texts);
      const before=await storage(page);
      await page.locator('#present').click();
      assert.equal(await page.locator('.slide-card').count(),Math.min(6,count));
      assert.deepEqual(await page.locator('.slide-card blockquote').allTextContents(),texts.slice(0,6));
      if(count===1)assert.equal(await page.locator('.present-progress').count(),0);
      if(count>6){await page.keyboard.press('ArrowRight');assert.deepEqual(await page.locator('.slide-card blockquote').allTextContents(),texts.slice(6));}
      await page.keyboard.press('Escape');
      assert.equal(await storage(page),before,'presentation never mutates stored workshop data');
      assert.equal(await page.locator('#present').evaluate(el=>el===document.activeElement),true);
    }
    const mixed=['A long answer. '.repeat(700),'two','three','four','five','six','seven'];
    await seed(page,mixed);
    await page.locator('#present').click();
    assert.equal(await page.locator('.slide-card').count(),1);
    const quote=page.locator('.slide-card blockquote');
    assert.equal(await quote.getAttribute('tabindex'),'0','long answers are keyboard reachable');
    await quote.focus(); const title=await page.locator('.slide-title').innerText();
    await page.keyboard.press('ArrowDown');
    assert.equal(await page.locator('.slide-title').innerText(),title,'arrow keys scroll a focused long answer');
    await page.waitForFunction(()=>document.activeElement.matches('blockquote') && document.activeElement.scrollTop>0,null,{timeout:5000});
    assert.ok(await quote.evaluate(el=>el.scrollTop>0),'native keyboard scrolling reads remaining text');
    await page.locator('[data-next]').click();
    assert.deepEqual(await page.locator('.slide-card blockquote').allTextContents(),mixed.slice(1));
    await page.setViewportSize({width:390,height:844});
    await page.waitForTimeout(120);
    assert.equal((await page.locator('.slide-card blockquote').allTextContents())[0],'two','resize keeps the response anchor');
    assert.ok(await page.locator('.slide-card').count()<=2);
    await page.keyboard.press('Escape');
    for(const width of [320,390,768,1440,1920]) {
      await page.setViewportSize({width,height:width<800?844:1080});
      await seed(page,['Unbroken'.repeat(1500)]);
      await page.locator('#present').click();
      assert.equal(await page.locator('.present').evaluate(el=>el.scrollWidth<=el.clientWidth),true,`presenter fits ${width}px`);
      assert.equal((await page.locator('blockquote').innerText()).length,12000);
      assert.equal(await page.getByRole('button',{name:'Close presentation',exact:true}).isVisible(),true);
      await page.keyboard.press('Escape');
    }
    await page.setViewportSize({width:1920,height:1080});
    await seed(page,['one','two','three'],{anonymise:true});
    await page.locator('.tabs button').nth(1).click();
    const ordered=await page.locator('.board-row').first().locator('.answer-text').allTextContents();
    await page.locator('#present').click();
    assert.deepEqual(await page.locator('blockquote').allTextContents(),ordered);
    assert.equal(await page.locator('.slide-card').filter({hasText:'Person'}).count(),0,'anonymity does not leak names');
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('.present').evaluate(el=>el.contains(document.activeElement)),true);
    assert.ok(await page.locator('.present-context').innerText());
    assert.ok(await page.locator('.present-discuss').innerText());
    if(evidence)await page.screenshot({path:evidence+'/presenter-desktop.png'});
    await page.evaluate(()=>{location.hash='';});
    await page.locator('.type-picker').waitFor();
    assert.equal(await page.locator('.present').count(),0);
    assert.equal(await page.locator('[inert]').count(),0,'closing restores the background');
    await seed(page,['one'],{empty:true});await page.locator('#present').click();
    assert.equal(await page.locator('.slide-empty').innerText(),'No replies to show.');
    await page.getByRole('button',{name:'Close presentation',exact:true}).click();
    await ctx.close(); console.log('PASS presenter ordering, pagination, long text, anonymity, resize, keyboard and cleanup');
  }
  if(['all','navigation'].includes(phase)) {
    const ctx=await context({viewport:{width:390,height:844}});const page=await ctx.newPage();
    await page.goto(origin+'/why-canvas.html');
    assert.equal(await page.locator('.type-picker input:checked').count(),0);
    await page.getByRole('button',{name:'See an example',exact:true}).click();
    await page.waitForURL('**/#example=product');
    const select=page.getByRole('combobox',{name:'Example type'});
    await select.selectOption('personal');
    await page.waitForURL('**/#example=personal');
    await page.getByRole('combobox',{name:'Example type'}).waitFor();
    assert.equal(await page.getByRole('combobox',{name:'Example type'}).evaluate(el=>el===document.activeElement),true);
    await page.getByRole('button',{name:'Exit demo',exact:true}).click();
    await page.locator('.type-picker').waitFor();
    await page.locator('input[value="team"]').check();
    await page.getByRole('button',{name:'See an example',exact:true}).click();
    await page.waitForURL('**/#example=team');
    await page.getByRole('button',{name:'See a group’s answers',exact:true}).click();
    await page.waitForURL('**/#demo=team');
    assert.deepEqual(await page.getByRole('combobox',{name:'Demo type'}).locator('option').allTextContents(),['Team','Product','Community']);
    await page.getByRole('button',{name:'Exit demo',exact:true}).click();
    await page.waitForURL('**/#example=team');
    await seed(page,['one','two']);
    assert.deepEqual(await page.locator('.tabs button').allTextContents(),['Import','Responses (2)']);
    await page.getByRole('button',{name:'Responses (2)',exact:true}).click();
    assert.equal(await page.getByRole('button',{name:/^(Agree|Diverge)$/}).count(),0);
    const star=page.getByRole('button',{name:'Star response',exact:true}).first();
    await star.focus();await page.keyboard.press('Space');
    assert.equal(await star.getAttribute('aria-pressed'),'true');
    assert.equal(await star.evaluate(el=>el===document.activeElement),true);
    const anonymise=page.getByRole('switch',{name:'Anonymise',exact:true});
    await anonymise.focus();await page.keyboard.press('Space');
    assert.equal(await page.getByRole('switch',{name:'Anonymise',exact:true}).evaluate(el=>el===document.activeElement),true);
    const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem(WhyCanvas.storageKey({type:'team',group:'Workshop'},'facilitator'))));
    assert.equal(Object.values(saved.highlights).filter(m=>m.star).length,2);
    assert.equal(Object.values(saved.highlights).filter(m=>m.tag==='agree').length,1,'legacy tags survive starring');
    const download=page.waitForEvent('download');await page.getByRole('button',{name:'Import',exact:true}).click();
    await page.getByRole('button',{name:'Export JSON',exact:true}).click();
    const exported=JSON.parse(readFileSync(await (await download).path(),'utf8'));
    assert.equal(Object.values(exported.highlights).filter(m=>m.tag==='agree').length,1);
    if(evidence)await page.screenshot({path:evidence+'/group-mobile.png'});
    await ctx.close();console.log('PASS setup, demo routing, focus, group labels, stars and export compatibility');
  }
  if(['all','theme'].includes(phase)) {
    for(const scheme of ['light','dark']) {
      const ctx=await context({colorScheme:scheme});const page=await ctx.newPage();await page.goto(origin+'/why-canvas.html');
      assert.equal(await page.locator('html').getAttribute('data-theme'),scheme);
      const toggle=page.getByRole('switch',{name:'Dark mode',exact:true});await toggle.click();
      assert.equal(await toggle.getAttribute('aria-checked'),String(scheme==='light'));
      await page.reload();assert.equal(await page.locator('html').getAttribute('data-theme'),scheme==='light'?'dark':'light');
      await seed(page,['one','two']);await page.locator('#present').click();
      assert.equal(await page.locator('.present').getByRole('switch',{name:'Dark mode',exact:true}).count(),1);
      const before=await storage(page);await page.getByRole('switch',{name:'Dark mode',exact:true}).click();
      assert.equal(await page.locator('.slide-card').count(),2);
      const after=JSON.parse(await storage(page)),original=JSON.parse(before);delete after['whycanvas:theme'];delete original['whycanvas:theme'];
      assert.deepEqual(after,original,'themes never change drafts');
      await page.keyboard.press('Escape');
      if(evidence)await page.screenshot({path:evidence+`/group-${scheme}.png`});
      await ctx.close();
    }
    const ctx=await context({colorScheme:'dark'});await ctx.addInitScript(()=>{Storage.prototype.getItem=()=>{throw new Error('Storage denied');};Storage.prototype.setItem=()=>{throw new Error('Storage denied');};});
    const page=await ctx.newPage();await page.goto(origin+'/why-canvas.html');await page.getByRole('switch',{name:'Dark mode',exact:true}).click();
    assert.equal(await page.locator('html').getAttribute('data-theme'),'light');await ctx.close();
    console.log('PASS system themes, explicit persistence, blocked storage and presentation theme switching');
  }
  assert.deepEqual(errors,[],'no browser errors');assert.deepEqual(external,[],'no external requests');
} finally {await browser.close();}
