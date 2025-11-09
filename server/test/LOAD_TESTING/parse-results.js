#!/usr/bin/env node

/**
 * Parse Artillery JSON results into human-readable format
 * Usage: node parse-results.js <path-to-json>
 */

const fs = require('fs');
const path = require('path');

const jsonPath = process.argv[2] || 'results/load.json';

if (!fs.existsSync(jsonPath)) {
  console.error(`❌ File not found: ${jsonPath}`);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const summary = data.aggregate;

// Create simplified JSON output
const simplifiedPath = jsonPath.replace('.json', '-summary.json');

console.log('\n' + '='.repeat(60));
console.log('📊 ARTILLERY LOAD TEST RESULTS');
console.log('='.repeat(60));

// Test Configuration
console.log('\n🎯 TEST CONFIGURATION');
console.log(`   Duration: ${Math.round(summary.testDuration / 1000)}s`);
console.log(`   Phases: ${data.intermediate?.length || 'N/A'}`);

// Request Statistics
console.log('\n📨 REQUEST STATISTICS');
console.log(`   Total Requests: ${summary.counters['vusers.created'] || 0}`);
console.log(`   Completed: ${summary.counters['vusers.completed'] || 0}`);
console.log(`   Failed: ${summary.counters['vusers.failed'] || 0}`);
console.log(`   Requests/sec: ${summary.rates?.['http.request_rate']?.toFixed(2) || 'N/A'}`);

// HTTP Response Codes
console.log('\n📡 HTTP RESPONSES');
Object.entries(summary.counters)
  .filter(([key]) => key.startsWith('http.codes'))
  .forEach(([key, value]) => {
    const code = key.split('.')[2];
    const emoji = code.startsWith('2') ? '✅' : code.startsWith('4') ? '⚠️' : '❌';
    console.log(`   ${emoji} ${code}: ${value}`);
  });

// Response Times
console.log('\n⏱️  RESPONSE TIMES (ms)');
const rt = summary.summaries?.['http.response_time'] || {};
console.log(`   Min:    ${rt.min?.toFixed(0) || 'N/A'} ms`);
console.log(`   Median: ${rt.median?.toFixed(0) || 'N/A'} ms`);
console.log(`   P95:    ${rt.p95?.toFixed(0) || 'N/A'} ms`);
console.log(`   P99:    ${rt.p99?.toFixed(0) || 'N/A'} ms`);
console.log(`   Max:    ${rt.max?.toFixed(0) || 'N/A'} ms`);

// Performance Thresholds
console.log('\n🎯 PERFORMANCE THRESHOLDS');
const errorRate = summary.counters['vusers.failed']
  ? (summary.counters['vusers.failed'] / summary.counters['vusers.created'] * 100).toFixed(2)
  : 0;

const p99Pass = rt.p99 ? (rt.p99 < 2000 ? '✅' : '❌') : '⚠️';
const p95Pass = rt.p95 ? (rt.p95 < 1500 ? '✅' : '❌') : '⚠️';
const errPass = errorRate < 1 ? '✅' : '❌';

console.log(`   ${p99Pass} P99 < 2000ms: ${rt.p99?.toFixed(0) || 'N/A'} ms`);
console.log(`   ${p95Pass} P95 < 1500ms: ${rt.p95?.toFixed(0) || 'N/A'} ms`);
console.log(`   ${errPass} Error Rate < 1%: ${errorRate}%`);

// Per-Endpoint Metrics (if available)
if (data.aggregate.histograms) {
  console.log('\n📍 PER-ENDPOINT METRICS');
  Object.entries(data.aggregate.histograms)
    .filter(([key]) => key.includes('http.response_time'))
    .forEach(([key, histogram]) => {
      const endpoint = key.split('|')[1] || 'Unknown';
      const p99 = histogram.p99?.toFixed(0) || 'N/A';
      const median = histogram.median?.toFixed(0) || 'N/A';
      console.log(`   ${endpoint}`);
      console.log(`     Median: ${median}ms | P99: ${p99}ms`);
    });
}

// Error Summary
if (summary.counters['errors.ECONNREFUSED'] || summary.counters['errors.ETIMEDOUT']) {
  console.log('\n❌ CONNECTION ERRORS DETECTED');
  if (summary.counters['errors.ECONNREFUSED']) {
    console.log(`   Connection Refused: ${summary.counters['errors.ECONNREFUSED']}`);
  }
  if (summary.counters['errors.ETIMEDOUT']) {
    console.log(`   Timeout: ${summary.counters['errors.ETIMEDOUT']}`);
  }
}

// Overall Status with colors
console.log('\n' + '='.repeat(60));
const allPass = p99Pass === '✅' && p95Pass === '✅' && errPass === '✅';

// ANSI color codes
const green = '\x1b[32m';
const red = '\x1b[31m';
const reset = '\x1b[0m';
const bold = '\x1b[1m';

if (allPass) {
  console.log(green + bold + '✅ ALL TESTS PASSED' + reset);
} else {
  console.log(red + bold + '❌ SOME TESTS FAILED' + reset);
}
console.log('='.repeat(60) + '\n');

// Generate simplified JSON output
const simplifiedData = {
  testInfo: {
    timestamp: new Date().toISOString(),
    duration: Math.round(summary.testDuration / 1000),
    phases: data.intermediate?.length || 0
  },
  requests: {
    total: summary.counters['vusers.created'] || 0,
    completed: summary.counters['vusers.completed'] || 0,
    failed: summary.counters['vusers.failed'] || 0,
    requestsPerSecond: parseFloat(summary.rates?.['http.request_rate']?.toFixed(2)) || 0
  },
  httpCodes: Object.entries(summary.counters)
    .filter(([key]) => key.startsWith('http.codes'))
    .reduce((acc, [key, value]) => {
      const code = key.split('.')[2];
      acc[code] = value;
      return acc;
    }, {}),
  responseTimes: {
    min: Math.round(rt.min || 0),
    median: Math.round(rt.median || 0),
    p95: Math.round(rt.p95 || 0),
    p99: Math.round(rt.p99 || 0),
    max: Math.round(rt.max || 0)
  },
  thresholds: {
    p99_under_2000ms: {
      passed: rt.p99 < 2000,
      value: Math.round(rt.p99 || 0),
      threshold: 2000
    },
    p95_under_1500ms: {
      passed: rt.p95 < 1500,
      value: Math.round(rt.p95 || 0),
      threshold: 1500
    },
    errorRate_under_1pct: {
      passed: errorRate < 1,
      value: parseFloat(errorRate),
      threshold: 1
    }
  },
  endpoints: {},
  errors: {},
  passed: allPass
};

// === NEW: Colored pass/fail status added to summary JSON ===
simplifiedData.status = allPass ? 'PASSED' : 'FAILED';
simplifiedData.statusColor = allPass ? 'green' : 'red';         // for UIs
simplifiedData.statusBadge = allPass ? '✅ PASSED' : '❌ FAILED'; // quick glance
simplifiedData.statusHex = allPass ? '#16a34a' : '#dc2626';      // green / red

// Extract per-endpoint metrics
if (data.aggregate.histograms) {
  Object.entries(data.aggregate.histograms)
    .filter(([key]) => key.includes('http.response_time'))
    .forEach(([key, histogram]) => {
      const endpoint = key.split('|')[1] || 'Unknown';
      simplifiedData.endpoints[endpoint] = {
        min: Math.round(histogram.min || 0),
        median: Math.round(histogram.median || 0),
        p95: Math.round(histogram.p95 || 0),
        p99: Math.round(histogram.p99 || 0),
        max: Math.round(histogram.max || 0)
      };
    });
}

// Extract error information
Object.entries(summary.counters)
  .filter(([key]) => key.startsWith('errors.'))
  .forEach(([key, value]) => {
    const errorType = key.replace('errors.', '');
    simplifiedData.errors[errorType] = value;
  });

// Save simplified JSON
fs.writeFileSync(simplifiedPath, JSON.stringify(simplifiedData, null, 2));
console.log(`📄 Simplified results saved to: ${simplifiedPath}\n`);

process.exit(allPass ? 0 : 1);