import type {ActionType, ProColumns} from '@ant-design/pro-components';
import {ProTable} from '@ant-design/pro-components';
import {List} from 'antd';
import React, {useEffect, useRef} from 'react';
import {getAPI} from 'obsidian-dataview';
import {formatValue} from "../GenerateColumns";
import {App, TFile} from "obsidian";
import {ViewProps} from "../../models/ViewProps";


const TableView: React.FC<ViewProps> = ({app, source}) => {

	const actionRef = useRef<ActionType>();
	const [columns, setColumns] = React.useState<ProColumns<any>[]>([]);

	const dv = getAPI(app);

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
				sorter: (a, b) => a[header].display.toString().localeCompare(b[header].display.toString()),
				render: (_, record) => {
					const {type, path, display} = record[header];
					if (type === "datetime") {
						return display;
					}
					if (type === "link") {
						return <a onClick={() => {
							const file = app.vault.getAbstractFileByPath(path);
							if (file && file instanceof TFile) {
								const leaf = app.workspace.getLeaf();
								leaf.openFile(file);
							}
						}}>
							{display}
						</a>
					}
					if (type === "array") {
						return display.map((v: any) => {
							if (typeof v === "object") {
								return <List.Item>
									<a onClick={() => {
										const file = app.vault.getAbstractFileByPath(v.path);
										if (file && file instanceof TFile) {
											const leaf = app.workspace.getLeaf();
											leaf.openFile(file);
										}
									}}>
										{v.display}
									</a>
								</List.Item>
							}
							return v;
						})
					}
					return display.toString();
				}
			};
		});
		columns.push(...dynamicColumns);
		return columns;
	}

	function parseTableResult(value: any, params: any): Array<Record<string, any>> {
		const headers: string[] = value.headers;
		console.log("headers", headers);
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

		//	console.log("rowsData", rows);
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
		console.log("source", source);
	}, []);


	return (
		<ProTable
			scroll={{x: 'max-content'}}
			actionRef={actionRef}
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
					console.log('value: ', value);
				},
			}}
			rowKey="title"
			search={{
				labelWidth: 'auto',
			}}
			options={{
				setting: {
					listsHeight: 400,
				},
			}}
			form={{
				// 由于配置了 transform，提交的参数与定义的不同这里需要转化一下
				syncToUrl: (values, type) => {
					if (type === 'get') {
						return {
							...values,
							// created_at: [values.startTime, values.endTime],
						};
					}
					return values;
				},
			}}
			pagination={{
				pageSize: 10,
				onChange: (page) => console.log(page),
			}}
			headerTitle="TablieView"
			request={async (params, sort, filter) => {
				console.log('params:', params);
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
