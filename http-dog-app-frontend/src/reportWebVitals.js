
// reportWebVitals.js

const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    // Simulate Web Vitals logging
    setTimeout(() => {
      onPerfEntry({
        name: 'dummyMetric',
        startTime: 0,
        value: 0.5,
      });
    }, 3000);
  }
};

export default reportWebVitals;
