const express = require('express');
const httpStatus = require('http-status');
const { monitorEventLoopDelay } = require('perf_hooks');
const AWS = require('aws-sdk');
// Set the region 
AWS.config.update({ region: 'us-east-1' });

// Create CloudWatch service object
const cw = new AWS.CloudWatch({ apiVersion: '2010-08-01' });

const app = express();
const port = 3010;

const h = monitorEventLoopDelay({ resolution: 20 });
h.enable();

setInterval(() => {
    addMetric(h.mean);
}, 300000);

app.get('/', (req, res) => {
    const responseStatus = req.query.status || httpStatus.NOT_FOUND;
    const response = {
        data: {
            message: httpStatus[responseStatus]
        }
    };
    console.info(response)
    res.status(responseStatus).json(response);
})

app.listen(port, () => {
    console.log({
        message: `Example app listening at http://localhost:${port}`
    })
});

const addMetric = (count) => {
    const params = {
        MetricData: [
            {
                MetricName: 'EVENT_LOOP_MEAN_DELAY',
                Dimensions: [
                    {
                        Name: 'CONTAINER',
                        Value: 'EXPRESS-APP-DEMO'
                    },
                ],
                Unit: 'None',
                Value: Math.floor(count/1000000)
            },
        ],
        Namespace: 'CONTAINER/EVENT_LOOP_MEAN_DELAY'
    };
    cw.putMetricData(params, function (err, data) {
        if (err) {
            console.log("Error", err);
        }
    });
}
