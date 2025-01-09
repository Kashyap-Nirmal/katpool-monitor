import axios from "axios";
import * as dotenv from "dotenv";
import { stringifyHashrate } from './utils';

dotenv.config();
const PROMETHEUS_URL = process.env.MONITORING || "http://kas.katpool.xyz:8080";

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
		console.log(`No results found for the query - ${query}.`);
		}
	} catch (err) {
		console.error('Error querying pool hash rate:', err)
	}
}

interface block_detail {
	block_hash: string, 
	[key : string]: string 
}

export async function getBlocks() {
	try {
		const url = `${PROMETHEUS_URL}/api/v1/query`;
		const query = `paid_blocks_1min_count`
		const response = await axios.get(url, {
			params: { query },
		});
		const data = response.data;
		const results = data.data?.result;
		let block_details : block_detail[] = [];
		if (results && results.length > 0) {
			results.forEach((result: any) => {
				let detail : block_detail = {
					block_hash: result?.metric?.block_hash,
					[result?.metric?.daa_score.toString()]: result?.metric?.timestamp,
				}
				block_details.push(detail)
			});
			return block_details
		} else {
			console.log(`No results found for the query - ${query}.`);
		}
	} catch (err) {
		console.error('Error querying blocks:', err)
	}	
}