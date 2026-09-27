const test = require('node:test');
const assert = require('node:assert/strict');
const model = require('../dist/model.json');
const fixtures = require('./fixtures.json');
const {predict} = require('../dist/predict.js');
test('Browser predictions match scikit-learn on 25 held-out examples',()=>{
  for(const row of fixtures) assert.ok(Math.abs(predict(model,row.input).price-row.expected)<0.000001);
});
test('Rejects missing, invalid, fractional, and out-of-range features',()=>{
  for(const value of ['',null,undefined,true,Infinity,-1,1.5,'invalid']) assert.throws(()=>predict(model,{...fixtures[0].input,'Gr Liv Area':value}));
  assert.throws(()=>predict(model,{...fixtures[0].input,Neighborhood:'Unknown'}));
});
test('Intervals contain point estimate and prices are nonnegative',()=>{
  for(const row of fixtures){const r=predict(model,row.input);assert.ok(r.lower>=0 && r.lower<=r.price && r.upper>=r.price);}
});
test('Test set beats the training-median baseline and all rows are partitioned',()=>{
  const r=model.report;assert.ok(r.model.mae<r.baseline.mae);assert.equal(r.counts.train+r.counts.calibration+r.counts.test,2930);assert.equal(r.scatter.length,r.counts.test);
});
