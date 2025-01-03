import axios from "axios";
import * as dotenv from "dotenv";
import { stringifyHashrate } from './utils';

dotenv.config();
const PROMETHEUS_URL = "katpool-prmths:9090";

async function queryPrometheus(timeInMin: number) {
  try {
	// Prometheus API endpoint
	const url = `${PROMETHEUS_URL}/api/v1/query`;

	console.log("Querying Prometheus...");
    
	// Send GET request to Prometheus API
	const QUERY = `avg_over_time(miner_hash_rate_GHps[${timeInMin/60}h])`; // Replace with your metric name
	console.log(QUERY)
	const response = await axios.get(url, {
  	params: { query: QUERY },
	});

	// Extract the data from the response
	const data = response.data;

	// Extract and log only the result if needed
	const results = data.data?.result;
	if (results && results.length > 0) {
  	console.log("\nFormatted Results:");
  	results.forEach((result: any) => {
    	console.log({
      	timestamp: result.value[0],
      	hash_rate: stringifyHashrate(result.value[1]),
    	});
  	});
	} else {
  	console.log("No results found for the query.");
	}
  } catch (error: any) {
	console.error("Error querying Prometheus:", error.message);
  }
}

export async function getCurrentPoolHashRate() {
	try {
		const url = `${PROMETHEUS_URL}/api/v1/query`;
		const query = `pool_hash_rate_GHps`
		const response = await axios.get(url, {
			params: { query },
		});
		const data = response.data;
		const results = data.data?.result;
		if (results && results.length > 0) {
			let hashRate;
			results.forEach((result: any) => {
				hashRate = stringifyHashrate(result.value[1])
			});
			return hashRate
		} else {
		console.log("No results found for the query.");
		}
	} catch (err) {
		console.error('Error querying pool hash rate:', err)
	}
}