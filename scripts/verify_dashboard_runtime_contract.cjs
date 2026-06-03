#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "working_dashboard.html"), "utf8");

const startMarker = "const DEFAULT_METRIC_CONTRACT = {";
const endMarker = "const metricDefs = [";
const start = html.indexOf(startMarker);
const end = html.indexOf(endMarker, start);

if (start === -1 || end === -1) {
  console.error("Could not isolate dashboard metric contract helpers.");
  process.exit(1);
}

const source = html.slice(start, end);
const script = `
${source}
this.__contracts = {
  DEFAULT_METRIC_CONTRACT,
  CRITICAL_METRIC_IDS,
  metricContract,
  withMetricContract,
  lastSeriesDate,
  isSeriesStale,
  validateMetricSeries,
  metricContractText
};
`;

const context = {
  console,
  Date,
  Math,
  Number,
  String,
  Array,
  Object,
  JSON,
  RegExp,
  Set,
  Map,
  Infinity,
  NaN,
  isNaN,
  parseFloat,
  parseInt
};
context.globalThis = context;
context.window = context;
context.self = context;

new vm.Script(script).runInNewContext(context);

const contracts = context.__contracts;
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const freshSeries = Array.from({ length: 30 }, (_, index) => ({
  date: new Date(Date.now() - (29 - index) * 60 * 60 * 1000).toISOString(),
  value: index + 1
}));

const staleSeries = Array.from({ length: 30 }, (_, index) => ({
  date: new Date(Date.now() - (100 - index) * 60 * 60 * 1000).toISOString(),
  value: index + 1
}));

const fresh = contracts.validateMetricSeries(freshSeries, contracts.metricContract());
assert(fresh.status === "live", "fresh series should remain live");
assert(fresh.series.length === 30, "fresh series should keep full series");

const stale = contracts.validateMetricSeries(staleSeries, contracts.metricContract());
assert(stale.status === "stale", "stale series should be downgraded to stale");
assert(/freshness contract/.test(stale.error), "stale series should explain freshness contract");

let tooShort = false;
try {
  contracts.validateMetricSeries(freshSeries.slice(0, 5), contracts.metricContract());
} catch (error) {
  tooShort = /required data points/.test(String(error.message || error));
}
assert(tooShort, "too-short series should fail min point validation");

assert(contracts.metricContract({ criticality: "critical" }).criticality === "critical", "metric contract overrides should apply");
assert(contracts.CRITICAL_METRIC_IDS.has("eth_price"), "critical metric ids should include eth_price");

console.log("dashboard runtime contract checks passed");
