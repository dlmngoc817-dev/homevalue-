# HomeValue - House Price Prediction

A complete machine learning portfolio project: a real Random Forest trained on Ames Housing, an interactive English-language website, honest evaluation, and automatic GitHub Pages deployment. Predictions run locally in the browser. No API key, paid AI service, database, or backend is required.

## Features

- Estimate historical house sale prices from living area, lot area, quality, year built, basement area, garage capacity, full bathrooms, bedrooms, and neighborhood.
- Display a calibrated prediction interval alongside the estimate.
- Inspect test metrics, feature importance, and an actual-versus-predicted scatter plot.
- Use the responsive website on desktop or mobile with labeled keyboard-accessible inputs.
- Reproduce training with Python and verify JavaScript predictions against scikit-learn.

## Run the website

The trained model is included. You only need Python 3 to serve the website; training dependencies are optional.

**Windows shortcut:** double-click `START_WEBSITE.bat`. It opens the website in your default browser. Keep the console window open while using it. Alternatively, run `python serve.py` on any platform.

```bash
python -m http.server 8000 --directory dist
```

Open http://localhost:8000. Do not double-click `index.html`: browsers restrict loading the model through `file://` URLs. Stop the server with Ctrl+C.

## Publish on GitHub and GitHub Pages

1. Create an empty GitHub repository named `homevalue` (do not initialize it with a README).
2. Extract this project and place its contents at the repository root. Include the hidden `.github` folder. You can use GitHub Desktop: add the extracted folder, create a repository if prompted, then publish it to GitHub. Alternatively, use the commands below from the extracted folder.
3. In the GitHub repository, open **Settings → Pages → Build and deployment → Source**, and select **GitHub Actions**.
4. Open **Actions → Test and deploy website → Run workflow**. Future pushes to `main` will run tests and redeploy automatically.
5. When the workflow succeeds, find the live URL in **Settings → Pages** or the deployment job. A project repository normally uses `https://YOUR_USERNAME.github.io/homevalue/`; replace `YOUR_USERNAME` with your account name. This is an example, not an already published URL.
6. Add that live URL to the repository's **About → Website** field.

```bash
git init
git add .
git commit -m "Add HomeValue machine learning project"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/homevalue.git
git push -u origin main
```

Use the downloadable ZIP as a fresh source tree for these commands. A working checkout created by a hosting provider may already have its own Git remote; do not replace it blindly. A public repository is the simplest option for a public portfolio. No custom GitHub secret is needed by the included workflow. GitHub account settings and plan availability still apply.

Official guide: [Using custom workflows with GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Model and evaluation

The target is `SalePrice` in historical USD. The dataset contains 2,930 residential sales in Ames, Iowa, from 2006–2010.

| Partition | Sale years | Rows | Purpose |
| --- | --- | ---: | --- |
| Training | 2006–2008 | 1,941 | Fit preprocessing and forest |
| Calibration | 2009 | 648 | Set residual interval width |
| Test | 2010 | 341 | Report final evaluation |

Training-only medians fill missing numeric values; training-only neighborhood categories are one-hot encoded. The model uses 80 trees, maximum depth 12, minimum 3 samples per leaf, 85% candidate features per split, and seed 42. Hyperparameters are fixed rather than tuned on the test set. Record IDs, sale price, and sale year are excluded from the inputs. Sale year is used only for partitioning. The exported model remains the training-only model; it is not refitted on the test set.

| Test metric | Random Forest | Training-median baseline |
| --- | ---: | ---: |
| MAE | $18,503 | $52,424 |
| RMSE | $27,205 | $75,286 |
| R² | 0.867 | -0.021 |

The forest reduces baseline MAE by 64.7%. These are measured results, not a claim of percentage accuracy. Full values and all test chart points are in `metrics.json`.

The nominal 90% interval uses the finite-sample adjusted 90th percentile of absolute calibration residuals (rank `ceil((n+1)*0.90)`). The lower end is clipped at zero. Actual coverage on the later test period is **88.3%**, so it is not a guaranteed 90% interval. Temporal market shifts violate the exchangeability assumption behind split conformal coverage. It is a marginal residual interval, not an individualized confidence estimate.

Feature importance is impurity-based and is not causal; correlated predictors and high-cardinality variables can bias it. Neighborhood importance is summed across one-hot columns.

## Reproduce training

Training was tested with Python 3.14, NumPy 2.5.3, and scikit-learn 1.9.1. Use the pinned dependencies for close reproducibility. Minor floating-point differences across platforms are possible.

```bash
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux instead: source .venv/bin/activate
python -m pip install -r requirements.txt
python train.py
```

The script downloads the public CSV when absent, checks its SHA-256, trains the model, and writes `dist/model.json`, `metrics.json`, and Python-reference fixtures. Raw data is ignored by Git. The website needs only the files inside `dist/`, and the forest is exported as numeric arrays rather than an executable pickle.

## Tests

Install Node.js 22 or newer, then run:

```bash
node --test tests/predict.test.cjs
```

Tests verify 25 browser/Python prediction parity examples, invalid input rejection, interval ordering, dataset partition counts, and improvement over the median baseline. The website converts input values to float32 before traversal to match scikit-learn's inference semantics. The GitHub Pages workflow runs these tests before deployment; it does not need to retrain the model.

## Project structure

```text
homevalue/
├── dist/
│   ├── index.html           # English website
│   ├── styles.css           # Responsive design
│   ├── app.js               # Form, report, charts
│   ├── predict.js           # Shared inference and validation
│   └── model.json           # Trained forest and evaluation
├── data/README.md           # Data provenance and download details
├── tests/
│   ├── fixtures.json        # scikit-learn reference predictions
│   └── predict.test.cjs
├── .github/workflows/pages.yml
├── train.py
├── serve.py                # Local server with automatic browser opening
├── START_WEBSITE.bat       # Windows launch shortcut
├── metrics.json
├── requirements.txt
├── README.md
└── LICENSE
```

## Limitations

This is an educational historical valuation model. It does not estimate current prices, adjust for inflation, or support other cities. Small or unusual subgroups may have larger errors. Accepted input limits are interface guardrails, not a guarantee that a combination is supported by enough examples. The dataset's recording process and omitted property characteristics can introduce bias. Do not use it as a professional appraisal or as an automated lending or housing eligibility system.

## Data attribution and license

Dean De Cock (2011), *Ames, Iowa: Alternative to the Boston Housing Data as an End of Semester Regression Project*, Journal of Statistics Education, 19(3).

- [Dataset documentation](https://modeldata.tidymodels.org/reference/ames.html)
- [Original paper](https://jse.amstat.org/v19n3/decock.pdf)
- [CSV mirror and provenance](data/README.md)

Project code is MIT licensed. Original data is subject to its source terms, is downloaded separately, and is not relicensed by this project.
