import type {ActionType, ProColumns} from '@ant-design/pro-components';
import {ProTable} from '@ant-design/pro-components';
import {List, Tag, Typography} from 'antd';
import React, {useEffect, useRef} from 'react';
import {getAPI} from 'obsidian-dataview';
import {formatValue} from "../GenerateColumns";
import {App, TFile} from "obsidian";
import {ViewProps} from "../../models/ViewProps";


const TableView: React.FC<ViewProps> = ({app, source}) => {

	const [columns, setColumns] = React.useState<ProColumns<any>[]>([]);

	const dv = getAPI(app);
	const {Text, Link} = Typography;


	const ellipsisLink = (display: string, path: any) => {
		return (
			<Link
				onClick={() => {
					const file = app.vault.getAbstractFileByPath(path);
					if (file && file instanceof TFile) {
						const leaf = app.workspace.getLeaf();
						leaf.openFile(file);
					}
				}}>
				<Text
					style={display ? {maxWidth: 200, color: '#1890ff'} : {color: '#1890ff'}}
					ellipsis={{expanded:true}}
				>
					{display}
				</Text>
			</Link>
		);
	};

	const ellipsisDisplay = (display: string) => {
		return (
			<Text
				style={display ? {maxWidth: 300} : undefined}
				ellipsis={{expanded:true}}
			>
				{display?.toString()}
			</Text>
		);
	};

	const createColumns = (headers: string[]) => {
		let columns = [];
		const firstColumn: ProColumns<any> = {
			dataIndex: 'index',
			valueType: 'indexBorder',
			title: 'index',
			sorter: true,
		};
		columns.push(firstColumn);
		const dynamicColumns: ProColumns<any>[] = headers.map((header) => {
			return {
				title: header,
				dataIndex: header,
				sorter: (a, b) => a[header]?.display?.toString()?.localeCompare(b[header]?.display?.toString()),
				render: (_, record) => {
					const {type, path, display} = record[header] || {};
					if (type === "datetime") {
						return ellipsisDisplay(display);
					}
					if (type === "link") {
						return ellipsisLink(display, path);
					}
					if (type === "array") {
						return display.map((v: any) => {
							if (typeof v === "object") {
								return <List.Item>
									{ellipsisLink(v.display, v.path)}
								</List.Item>
							} else {
								// tags
								return <List.Item>
									<Tag>{v}</Tag>
								</List.Item>
							}
						})
					}
					return ellipsisDisplay(display?.toString());
				}
			};
		});
		columns.push(...dynamicColumns);
		return columns;
	}

	function parseTableResult(value: any, params: any): Array<Record<string, any>> {
		const headers: string[] = value.headers;
		// console.log("headers", headers);
		//	console.log("valueData", value);

		const rows: Array<Record<string, any>> = [];

		value.values.forEach((row: any) => {
			const values: Record<string, any> = {};
			headers.forEach((header, index) => {
				const value = row[index];
				const resValue = formatValue(value);
				values[header] = resValue;
			});
			rows.push(values);
		});

		delete params.current;
		delete params.pageSize;

		// console.log("rowsData", rows);
		//	console.log("paramsData", params);

		const filteredData = rows.filter(item => {
			return Object.keys(params).every(key => {
				if (params[key]) {
					//		console.log("param1 key", key);
					// If item[key] is empty, return false directly.
					if (item[key]) {
						//			console.log("item[key]", item[key]);
						return item[key].display.toString().toLowerCase().includes(params[key].toString().toLowerCase());
					} else {
						return true;
					}
				}
				return true;
			});
		});

		return filteredData;
	}

	const executeTableQuery = async (dvApi: any, source: any, params: any) => {
		const sql = source;

		const queryResult = await dvApi.query(sql);

		const tableData: any = parseTableResult(queryResult.value, params);

		const headers: string[] = queryResult.value.headers;
		const columns = createColumns(headers);

		return {tableData: tableData, columns: columns};
	}

	useEffect(() => {
		//	console.log("source", source);
	}, []);


	return (
		<ProTable
			scroll={{x: 'max-content'}}
			cardBordered
			editable={{
				type: 'multiple',
			}}
			columns={columns}
			//	dataSource={data}
			columnsState={{
				persistenceKey: 'pro-table-singe-demos',
				persistenceType: 'localStorage',
				defaultValue: {
					option: {fixed: 'right', disable: true},
				},
				onChange(value) {
					//	console.log('value: ', value);
				},
			}}
			rowKey="title"
			search={{
				labelWidth: 'auto',
			}}
			pagination={{
				showSizeChanger: true,
			}}
			headerTitle="TableView"
			request={async (params, sort, filter) => {
				//	console.log('params:', params);
				const response = await executeTableQuery(dv, source, params);
				const {tableData, columns} = response;

				setColumns(columns);
				return Promise.resolve({
					data: tableData,
					success: true,
					total: tableData.length,
					//	columns: columns,
				});
			}}
		/>
	);
};
export default TableView;
