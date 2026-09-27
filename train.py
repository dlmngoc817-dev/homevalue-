"""Train and export a real Random Forest for dependency-free browser inference."""
from pathlib import Path
import csv
import hashlib
import json
import math
import urllib.request
import numpy as np
import sklearn
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

ROOT = Path(__file__).resolve().parent
SOURCE = 'https://raw.githubusercontent.com/wblakecannon/ames/378badd2c9e2e901a4bd4d466e9439d5e0059499/data/housing.csv'
EXPECTED_SHA256 = '1cf821e5ab53ce9ac177cb663872c2d2b8c5b385f85eed495ce62a213bd34f86'
FEATURES = ['Gr Liv Area', 'Lot Area', 'Overall Qual', 'Year Built', 'Total Bsmt SF', 'Garage Cars', 'Full Bath', 'Bedroom AbvGr']
LABELS = ['Living area', 'Lot area', 'Overall quality', 'Year built', 'Basement area', 'Garage spaces', 'Full bathrooms', 'Bedrooms']
BOUNDS = [[334,5642],[1300,215245],[1,10],[1872,2010],[0,6110],[0,5],[0,4],[0,8]]
DEFAULTS = [1600,9000,6,1980,900,2,2,3]

def train():
    path = ROOT / 'data/ames.csv'
    path.parent.mkdir(exist_ok=True)
    if not path.exists():
        urllib.request.urlretrieve(SOURCE, path)
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    if digest != EXPECTED_SHA256:
        raise ValueError('Dataset checksum mismatch: use the documented source snapshot.')
    with path.open(newline='', encoding='utf-8') as f:
        rows = list(csv.DictReader(f))
    assert len(rows) == 2930, 'Unexpected dataset size'
    train_rows = [r for r in rows if int(r['Yr Sold']) <= 2008]
    calibration = [r for r in rows if int(r['Yr Sold']) == 2009]
    test = [r for r in rows if int(r['Yr Sold']) == 2010]
    neighborhoods = sorted({r['Neighborhood'] for r in train_rows})
    medians = [float(np.median([float(r[k]) for r in train_rows if r[k]])) for k in FEATURES]
    def encode(rs):
        return np.array([[float(r[k]) if r[k] else medians[i] for i,k in enumerate(FEATURES)] + [float(r['Neighborhood']==n) for n in neighborhoods] for r in rs], dtype=np.float32)
    def target(rs):
        return np.array([float(r['SalePrice']) for r in rs])
    x, y = encode(train_rows), target(train_rows)
    model = RandomForestRegressor(n_estimators=80, max_depth=12, min_samples_leaf=3, max_features=0.85, random_state=42, n_jobs=-1)
    model.fit(x,y)
    residuals = np.sort(np.abs(target(calibration)-model.predict(encode(calibration))))
    rank = min(len(residuals), math.ceil((len(residuals)+1)*0.90))
    radius = float(residuals[rank-1])
    actual, predicted = target(test), model.predict(encode(test))
    baseline = np.full(len(test), np.median(y))
    def scores(a,p):
        return {'mae':float(mean_absolute_error(a,p)), 'rmse':float(math.sqrt(mean_squared_error(a,p))), 'r2':float(r2_score(a,p))}
    trees=[]
    for estimator in model.estimators_:
        t=estimator.tree_
        trees.append({'left':t.children_left.tolist(),'right':t.children_right.tolist(),'feature':t.feature.tolist(),'threshold':t.threshold.tolist(),'value':t.value[:,0,0].tolist()})
    importance = model.feature_importances_.tolist()
    report = {'model':scores(actual,predicted),'baseline':scores(actual,baseline),'coverage':float(np.mean(np.abs(actual-predicted)<=radius)), 'radius':radius, 'counts':{'train':len(train_rows),'calibration':len(calibration),'test':len(test),'total':len(rows)}, 'importance':[{'name':name,'value':v} for name,v in zip(LABELS+['Neighborhood'],importance[:8]+[sum(importance[8:])])], 'scatter':[{'actual':round(a),'predicted':round(p)} for a,p in zip(actual,predicted)],'source':SOURCE,'sha256':digest,'sklearn':sklearn.__version__}
    payload = {'features':FEATURES,'labels':LABELS,'bounds':BOUNDS,'defaults':DEFAULTS,'neighborhoods':neighborhoods,'medians':medians,'trees':trees,'report':report}
    dist=ROOT/'dist'
    dist.mkdir(exist_ok=True)
    (dist/'model.json').write_text(json.dumps(payload,separators=(',',':')),encoding='utf-8')
    (ROOT/'metrics.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    fixtures=[{'input':dict(zip(FEATURES,[float(r[k]) if r[k] else medians[i] for i,k in enumerate(FEATURES)])) | {'Neighborhood':r['Neighborhood']},'expected':float(p)} for r,p in zip(test[:25],predicted[:25])]
    (ROOT/'tests/fixtures.json').write_text(json.dumps(fixtures),encoding='utf-8')
    print(json.dumps({k:report[k] for k in ['model','baseline','coverage','counts','sha256']},indent=2))

if __name__=='__main__':
    train()
