const $ = id => document.getElementById(id);
const money = value => new Intl.NumberFormat('en-US', {style:'currency',currency:'USD',maximumFractionDigits:0}).format(value);
let model;
function showPrediction(input) {
  const output = HomeValue.predict(model,input);
  $('price').textContent=money(output.price);
  $('interval').textContent=`${money(output.lower)} – ${money(output.upper)}`;
  $('summary').textContent=`${Number(input['Gr Liv Area']).toLocaleString('en-US')} sq ft living area · ${input['Bedroom AbvGr']} bedrooms · ${input['Full Bath']} full baths · ${input.Neighborhood}`;
  $('error').hidden=true;
  $('status').textContent='Estimate updated. Inference runs entirely in your browser.';
  return output;
}
function readInput(){return Object.fromEntries(new FormData($('property-form')));}
function reset(){model.features.forEach((k,i)=>document.getElementsByName(k)[0].value=model.defaults[i]);$('neighborhood').value='NAmes';showPrediction(readInput());}
function showError(error){$('error').textContent=error.message;$('error').hidden=false;}
$('property-form').addEventListener('submit',event=>{event.preventDefault();try{showPrediction(readInput());}catch(error){showError(error);}});
$('reset').addEventListener('click',()=>{if(model)reset();});
async function initialize(){
 try{
  const response=await fetch('model.json');if(!response.ok)throw new Error('The trained model could not be loaded. Refresh to try again.');model=await response.json();
  const units=['sq ft','sq ft','/ 10','year','sq ft','cars','baths','beds'];
  model.features.forEach((name,i)=>{const label=document.createElement('label');label.htmlFor=`feature-${i}`;label.textContent=model.labels[i];const wrap=document.createElement('div');wrap.className='input-wrap';const input=document.createElement('input');Object.assign(input,{id:`feature-${i}`,name,type:'number',min:model.bounds[i][0],max:model.bounds[i][1],step:1,required:true,value:model.defaults[i]});const unit=document.createElement('span');unit.className='unit';unit.textContent=units[i];wrap.append(input,unit);label.append(wrap);$('fields').append(label);});
  model.neighborhoods.forEach(n=>{const option=document.createElement('option');option.value=n;option.textContent=n;$('neighborhood').append(option);});
  $('inputs').disabled=false;reset();
  $('property-form').addEventListener('input',()=>{$('status').textContent='Details changed. Select Estimate house price to update the result.';});
  const r=model.report;$('mae').textContent=money(r.model.mae);$('rmse').textContent=money(r.model.rmse);$('r2').textContent=r.model.r2.toFixed(3);$('coverage').textContent=`${(r.coverage*100).toFixed(1)}%`;
  [...r.importance].sort((a,b)=>b.value-a.value).forEach(item=>{const row=document.createElement('div');row.className='bar-row';const label=document.createElement('span');label.textContent=item.name;const track=document.createElement('span');track.className='bar-track';const bar=document.createElement('i');bar.style.width=`${item.value*100}%`;track.append(bar);const value=document.createElement('span');value.textContent=`${Math.round(item.value*100)}%`;row.append(label,track,value);$('importance').append(row);});
  const max=Math.ceil(Math.max(...r.scatter.flatMap(p=>[p.actual,p.predicted]))/100000)*100000;const sx=v=>52+v/max*350,sy=v=>252-v/max*215;
  let svg='<svg viewBox="0 0 440 300" role="img" aria-label="Scatter plot of actual and predicted 2010 house prices"><title>Actual sale price on horizontal axis; predicted sale price on vertical axis</title>';
  for(let i=0;i<=4;i++){const value=max*i/4;svg+=`<line x1="52" y1="${sy(value)}" x2="402" y2="${sy(value)}" stroke="#e7edf3"/><text x="44" y="${sy(value)+4}" text-anchor="end" font-size="12" fill="#6e8092">${value/1000}k</text><text x="${sx(value)}" y="271" text-anchor="middle" font-size="12" fill="#6e8092">${value/1000}k</text>`;}
  svg+=`<line x1="52" y1="252" x2="402" y2="37" stroke="#59738d" stroke-dasharray="5 5"/>`;
  r.scatter.forEach(p=>{svg+=`<circle cx="${sx(p.actual)}" cy="${sy(p.predicted)}" r="3" fill="#168b88" opacity=".45"><title>Actual ${money(p.actual)} · Predicted ${money(p.predicted)}</title></circle>`;});
  svg+='<text x="225" y="296" font-size="12" fill="#536c84" text-anchor="middle">Actual sale price (USD)</text><text x="52" y="18" font-size="12" fill="#536c84">Predicted price (USD)</text></svg>';$('scatter').innerHTML=svg;
  $('baseline').textContent=`Baseline comparison: always predicting the training median produces an MAE of ${money(r.baseline.mae)}. The Random Forest reduces that error by ${(100*(1-r.model.mae/r.baseline.mae)).toFixed(1)}%.`;
  $('train-count').textContent=`${r.counts.train.toLocaleString('en-US')} sales · fixed seed 42 · training-only median imputation`;
  $('cal-count').textContent=`${r.counts.calibration} sales · 90% nominal residual interval`;
  $('test-count').textContent=`${r.counts.test} sales · MAE, RMSE, R², and interval coverage`;
  if(document.modelContext?.registerTool){try{await document.modelContext.registerTool({name:'estimate_house_price',description:'Estimate a historical Ames house sale price and update the visible result and form.',inputSchema:{type:'object',properties:Object.fromEntries([...model.features.map((k,i)=>[k,{type:'integer',minimum:model.bounds[i][0],maximum:model.bounds[i][1]}]),['Neighborhood',{type:'string',enum:model.neighborhoods}]]),required:[...model.features,'Neighborhood'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){HomeValue.predict(model,input);model.features.forEach(k=>document.getElementsByName(k)[0].value=input[k]);$('neighborhood').value=input.Neighborhood;return showPrediction(input);}});}catch(error){console.info('Optional browser agent integration unavailable.',error);}}
 }catch(error){$('status').textContent='Model unavailable.';showError(error);}
}
initialize();
