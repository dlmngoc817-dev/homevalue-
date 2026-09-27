# Data provenance

The Ames Housing dataset was compiled by Dean De Cock for statistical learning education. It describes 2,930 residential property sales in Ames, Iowa from 2006 to 2010.

- Original reference: https://jse.amstat.org/v19n3/decock.pdf
- Maintained documentation: https://modeldata.tidymodels.org/reference/ames.html
- Download snapshot: https://raw.githubusercontent.com/wblakecannon/ames/378badd2c9e2e901a4bd4d466e9439d5e0059499/data/housing.csv
- SHA-256: `1cf821e5ab53ce9ac177cb663872c2d2b8c5b385f85eed495ce62a213bd34f86`

`python train.py` downloads the CSV to `data/ames.csv` if missing and checks the checksum before training. The extra CSV index and property identifiers are ignored. Missing numeric values use medians computed only on the training years. No rows are removed. The raw CSV is intentionally excluded from Git and from the deliverable ZIP; this project's MIT license applies to its code, not the source dataset.
