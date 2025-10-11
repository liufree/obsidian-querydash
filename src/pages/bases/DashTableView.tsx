import {BasesView, QueryController} from 'obsidian';
import {createRoot} from "react-dom/client";
import React, {useEffect} from "react";
import {ViewProps} from "../../models/ViewProps";
import {ProColumns, ProTable} from "@ant-design/pro-components";
import {ellipsisDisplay, formatValue} from "../GenerateColumns";
import {getAPI} from "obsidian-dataview";

export const TableViewType = 'dash-table-view';

export class DashTableView extends BasesView {
	readonly type = TableViewType;
	private containerEl: HTMLElement;

	constructor(controller: QueryController, parentEl: HTMLElement) {
		super(controller);
		this.containerEl = parentEl.createDiv('bases-example-view-container');
	}

	public onDataUpdated(): void {
		const {app} = this;
		this.containerEl.empty();

		console.log(this.data.data);

		const source = "table file.name , file.outlinks as \"links\" ,file.ctime as \"ctime\",  \n" +
			"file.mtime as \"mtime\" ,file.tags as \"tags\" from #clippings";
		const container = this.containerEl.createDiv();
		const root = createRoot(container);
		root.render(<TableView app={app} source={source}/>);
	}
}

const TableView: React.FC<ViewProps> = ({app, source}) => {

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
				sorter: (a, b) => a[header]?.display?.toString()?.localeCompare(b[header]?.display?.toString()),
				render: (_, record) => {
					const {type, path, display} = record[header] || {};
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

		value.values.forEach((row: any, rowIndex: number) => {
			const values: Record<string, any> = {};
			headers.forEach((header, index) => {
				const value = row[index];
				const resValue = formatValue(value);
				values[header] = resValue;
			});
			values['key'] = rowIndex; // Add a unique key for each row
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
			rowKey={(record) => record.key}
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


