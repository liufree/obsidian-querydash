import {ProList} from '@ant-design/pro-components';
import React from "react";
import {formatValue} from "../GenerateColumns";
import {getAPI} from 'obsidian-dataview';
import {ViewProps} from "../../models/ViewProps";


const ListView: React.FC<ViewProps> = ({app, source}) => {

	const [metas, setMetas] = React.useState<any>({});

	const dv = getAPI(app);

	function parseTableResult(value: any, params: any): Array<Record<string, any>> {
		const headers: string[] = value.headers;
		const rows: Array<Record<string, any>> = [];
		value.values.forEach((row: any) => {
			const values: Record<string, any> = {};
			headers.forEach((header, index) => {
				const value = row[index];
				console.log("list value", value);
				const resValue = formatValue(value);
				console.log("list resValue", resValue);
				values[header] = resValue;
			});
			rows.push(values);
		});
		// params参数去除current和pageSize
		delete params.current;
		delete params.pageSize;

		console.log("list rows", rows);

		const filteredData = rows.filter(item => {
			return Object.keys(params).every(key => {

				if (params[key]) {
					// If item[key] is empty, return false directly.
					if (item[key]) {
						return item[key].toString().toLowerCase().includes(params[key].toString().toLowerCase());
					} else {
						return true;
					}
				}
				return true;
			});
		});


		return filteredData;
	}

	function replaceFirstWord(source: string): string {
		// 将句子按空格分割成单词数组
		const words = source.split(' ');

		// 如果第一个单词是"List"，则替换为"Table"
		if (words[0] === 'list') {
			words[0] = 'table';
		}

		// 将单词数组重新组合成句子
		return words.join(' ');
	}

	const executeTableQuery = async (dvApi: any, source: any, params: any) => {
		// 定义查询语句
		// source是一个句子，将source的第一个单词List转成Table

		const sql = replaceFirstWord(source);
		// 使用 Dataview API 执行查询
		const queryResult = await dvApi.query(sql);
		const tableData: any = parseTableResult(queryResult.value, params);
		return {tableData: tableData};

	}


	return <ProList
	//	search={{}}
		rowKey="name"
		headerTitle="ListView"
		request={async (params = {}) => {
			// console.log('params:', params);
			const response = await executeTableQuery(dv, source, params);
			const {tableData} = response;
		//	console.log("listData", tableData);
			return Promise.resolve({
				data: tableData,
				success: true,
				total: tableData.length,
				//	columns: columns,
			});
		}}
		pagination={{
			pageSize: 5,
		}}
		showActions="hover"
		metas={{
			title: {
				title: 'title',
				render: (_, record: any) => {
					console.log("list record", record);
					return <a>{record.File.path}</a>;
				}
			},
		}}
	/>
}

export default ListView;
