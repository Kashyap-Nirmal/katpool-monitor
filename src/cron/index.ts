const NodeCache = require('node-cache');
import axios from "axios";
const PROMETHEUS_URL = process.env.MONITORING || "http://kas.katpool.xyz:8080";
// Cache entries live for 60 seconds (1 minute)
const cache = new NodeCache({ stdTTL: 60, checkperiod: 60 });

const cacheSuccessBlocksDetails = async () => {
  try {
      const url = `${PROMETHEUS_URL}/api/v1/query`;
      const query = `last_over_time(success_blocks_details[365d])`;

      const response = await axios.get(url, {
        params: { query },
      });

      const data = response.data;
      const results = data.data?.result;
      cache.set('success_blocks_details', results);
      console.log('Cached new results at', new Date().toISOString());
  } catch (error) {
    console.error('Error cacheSuccessBlocksDetails', error);
  }
};

export { cacheSuccessBlocksDetails, cache };