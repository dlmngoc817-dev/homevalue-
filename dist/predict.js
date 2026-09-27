/* Exact traversal of exported scikit-learn trees; usable in browser and Node. */
(function (root) {
  function predict(model, input) {
    const x = model.features.map((key, i) => {
      const raw = input[key];
      if (raw === '' || raw === null || raw === undefined || typeof raw === 'boolean') throw new Error(`Enter ${model.labels[i].toLowerCase()}.`);
      const value = Number(raw), [min, max] = model.bounds[i];
      if (!Number.isFinite(value) || value < min || value > max) throw new Error(`${model.labels[i]} must be between ${min} and ${max}.`);
      if (!Number.isInteger(value)) throw new Error(`${model.labels[i]} must be a whole number.`);
      return Math.fround(value);
    });
    if (!model.neighborhoods.includes(input.Neighborhood)) throw new Error('Choose a supported Ames neighborhood.');
    x.push(...model.neighborhoods.map(n => Number(n === input.Neighborhood)));
    const price = model.trees.reduce((sum, tree) => {
      let node = 0;
      while (tree.left[node] !== -1) node = x[tree.feature[node]] <= tree.threshold[node] ? tree.left[node] : tree.right[node];
      return sum + tree.value[node];
    }, 0) / model.trees.length;
    return {price, lower: Math.max(0, price - model.report.radius), upper: price + model.report.radius};
  }
  if (typeof module !== 'undefined') module.exports = {predict};
  else root.HomeValue = {predict};
})(typeof globalThis !== 'undefined' ? globalThis : this);
