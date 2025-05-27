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
				hashRate = stringifyHashrate(result?.value[1])
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
		const query = `last_over_time(success_blocks_details[1y])`
		const response = await axios.get(url, {
			params: { query },
		});
		const data = response.data;
		const results = data.data?.result

		let block_details : block_detail[] = [];
		if (results && results.length > 0) {
			results.forEach((result: any) => {
				let detail : block_detail = {
					block_hash: result?.metric?.block_hash,
					[result?.metric?.daa_score.toString()]: result?.value[1],
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

export async function getLastBlockDetails() {
	try {
		let url = `${PROMETHEUS_URL}/api/v1/query`;
		let query = `max(success_blocks_details)`
		let response = await axios.get(url, {
			params: { query },
		});
		let data = response.data;
		let results = data.data?.result;
		if (results && results?.length > 0) {
			const lastblocktime = results[0]?.value[1]
			url = `${PROMETHEUS_URL}/api/v1/query`;
			query = `success_blocks_details==${lastblocktime}`
			response = await axios.get(url, {
				params: { query },
			});
			data = response.data;
			results = data.data?.result;
			if (results && results?.length > 0) {
				const lastblock = results[0]?.metric?.daa_score
				return {lastblocktime, lastblock}
			} else {
				console.log(`No results found for the query - ${query}.`);
			}
		} else {
			console.log(`No results found for the query - ${query}.`);
		}
	} catch (err) {
		console.error('Error querying blocks:', err)
	}	
}