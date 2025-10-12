import {BasesPropertyId, BasesView, MarkdownRenderer, parsePropertyId, QueryController} from 'obsidian';
import {createRoot} from "react-dom/client";
import React, {useEffect} from "react";
import {ViewProps} from "../../models/ViewProps";
import {ProColumns, ProTable} from "@ant-design/pro-components";
import {ellipsisDisplay, ellipsisLink, externalLink} from "../GenerateColumns";
import {List, Tag} from "antd";

export const TableViewType = 'dash-table-view';

export class DashTableView extends BasesView {
	readonly type = TableViewType;
	private containerEl: HTMLElement;


	constructor(controller: QueryController, parentEl: HTMLElement) {
		super(controller);
		this.containerEl = parentEl.createDiv('bases-example-view-container');
	}

	createColumns = (app: any, properties: string[]) => {
		let columns = [];
		const firstColumn: ProColumns<any> = {
			dataIndex: 'index',
			valueType: 'indexBorder',
			title: 'index',
			sorter: true,
		}
		columns.push(firstColumn);
		const dynamicColumns: ProColumns<any>[] = properties.map((property) => {
				return {
					title: property,
					dataIndex: property,
					render: (_, record) => {
						const data = record[property];

						const filePath = record["file.path"];

						const {type, name, display} = data || {};

						if (display == 'null') {
							return null;
						}

						if (type == 'file' && name == 'name') {
							return ellipsisLink(app, display, filePath);
						}
						if (name == 'tags') {
							console.log("tags", display);
							const tag = display.split(',');
							return tag.map((v: any) => {
								if (typeof v === "object") {
									return <List.Item>
										{ellipsisLink(app, v.display, v.name)}
									</List.Item>
								} else {
									// tags
									return <List.Item>
										<Tag>{v || null}</Tag>
									</List.Item>
								}
							})
						}

						if (type === "externalLink") {
							return externalLink(display, name);
						}

						return ellipsisDisplay(display?.toString());
					}
				};
			}
		);
		columns.push(...dynamicColumns);
		return columns;
	}


	public onDataUpdated(): void {
		const {app} = this;
		this.containerEl.empty();

		let newDatas: Record<string, any> = []
		const data = this.data.data;
		data.map(item => {

			let newItem: Record<string, any> = {};

			this.data.properties.map((prop: BasesPropertyId) => {

				const {type, name} = parsePropertyId(prop);

				// `entry.getValue` returns the evaluated result of the property
				// in the context of this entry.
				const value = item.getValue(prop);

				const rowData = {
					type: type,
					name: name,
					display: value?.toString() || "",
				}
				newItem[prop] = rowData
			})

			const filePath = item.getValue("file.path");
			newItem["file.path"] = filePath

			newDatas.push(newItem);

		});

		const columnsHead = this.createColumns(app, this.data.properties);

		const container = this.containerEl.createDiv();
		const root = createRoot(container);
		root.render(<TableView app={app} source={""} columnsHead={columnsHead} data={newDatas}/>);
	}

}

const
	TableView: React.FC<ViewProps> = ({app, source, columnsHead, data}) => {

		const [columns, setColumns] = React.useState<ProColumns<any>[]>([]);

		function parseTableResult(rows: any, params: any): Array<Record<string, any>> {
			delete params.current;
			delete params.pageSize;

			const filteredData = rows.filter(item => {
				return Object.keys(params).every(key => {
					if (params[key]) {
						if (item[key]) {
							return item[key]?.display?.toString().toLowerCase().includes(params[key].toString().toLowerCase());
						} else {
							return true;
						}
					}
					return true;
				});
			});

			return filteredData;
		}

		const executeTableQuery = async (datas: any, params: any) => {
			const queryResult = datas

			const tableData: any = parseTableResult(queryResult, params);

			const columns = columnsHead;

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
					const response = await executeTableQuery(data, params);

					const {tableData, columns} = response;

					setColumns(columns);
					return Promise.resolve({
						data: tableData,
						success: true,
						total: tableData.length,
					});
				}}
			/>
		);
	};


