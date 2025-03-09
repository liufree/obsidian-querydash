import type {ActionType, ProColumns} from '@ant-design/pro-components';
import {ProTable} from '@ant-design/pro-components';
import {Space, List} from 'antd';
import React, {useEffect, useRef} from 'react';
import {getAPI} from 'obsidian-dataview';
import {formatValue} from "../GenerateColumns";


interface MyReactComponentProps {
	app: any; // Obsidian的App对象
	source: string; // 当前文件的路径
}


const TableView: React.FC<MyReactComponentProps> = ({app, source}) => {
	const actionRef = useRef<ActionType>();

	const [columns, setColumns] = React.useState<ProColumns<any>[]>([]);

	const dv = getAPI(app);

	const createColumns = (headers: string[]) => {
		let columns = [];
		const firstColumn: ProColumns<any> = {
			dataIndex: 'index',
			valueType: 'indexBorder',
			title:'index',
			sorter: true,
		};

		columns.push(firstColumn);
		const dynamicColumns: ProColumns<any>[] = headers.map((header) => {

			return {
				title: header,
				dataIndex: header,
				sorter: true,
				render: (_, record) => {
					const {type, path, display} = record[header];

					if (type === "datetime") {
						return display;
					}
					if (type === "link") {
						return <a onClick={() => {
							const file = app.vault.getAbstractFileByPath(path);
							if (file) {
								app.workspace.activeLeaf?.openFile(file);
							}
						}}>
							{display}
						</a>
					}
					if (type === "array") {
						return display.map((v) => {
							if (typeof v === "object") {
								return <List.Item>
									<a onClick={() => {
										const file = app.vault.getAbstractFileByPath(v.path);
										if (file) {
											app.workspace.activeLeaf?.openFile(file);
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
		console.log("params1", params);


		value.values.forEach((row) => {
			const values: Record<string, any> = {};

			headers.forEach((header, index) => {
				const value = row[index];
				const resValue = formatValue(value);
				values[header] = resValue;
			});
			rows.push(values);
		});


		// params参数去除current和pageSize
		delete params.current;
		delete params.pageSize;

		const filteredData = rows.filter(item => {
			return Object.keys(params).every(key => {
				console.log("key", key);
				console.log("params[key]", params[key]);
				console.log("item[key]", item[key]);
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


		console.log("rows2", rows);
		console.log("keyParams", Object.keys(params));
		console.log("params2", params);

		return filteredData;
	}

	const executeTableQuery = async (dvApi: any, source: any, params: any) => {
		// 定义查询语句
		const sql = source;

		// 使用 Dataview API 执行查询
		const queryResult = await dvApi.query(sql);
		console.log("Query Result:", queryResult);
		console.log("Query Result1:", queryResult.successful);
		console.log("Query Result2:", queryResult.value);

		const tableData: any = parseTableResult(queryResult.value, params);

		const headers: string[] = queryResult.value.headers;


		const columns = createColumns(headers);


		console.log("columns:", columns);
		console.log("tableData:", tableData);

		// 处理查询结果
		if (queryResult.successful) {
			const tableData = queryResult.value;
			console.log("Query Result:", tableData);
			// 在这里可以对查询结果进行进一步处理
			tableData.values.forEach(row => {
				console.log("Row:", row);
			});
		} else {
			console.error("Query failed:", queryResult.error);
		}
		return {tableData: tableData, columns: columns};

	}

	useEffect(() => {
		console.log("source", source);
	}, []);

	const columns1 = [
		{
			dataIndex: 'index',
			valueType: 'indexBorder',
			width: 48,
		},
		{
			title: '标题',
			dataIndex: 'file.name',
			render: (_, record) => (
				console.log("record,{},text", _, record),
					<a onClick={() => {
						// 调用 Obsidian API
						const file = app.vault.getAbstractFileByPath(record.File.path);
						if (file) {
							app.workspace.activeLeaf?.openFile(file);
						}
					}}>
						{record.File.path}
					</a>

			),
		},
		{
			title: '文本',
			dataIndex: 'text',
			filters: true,
			onFilter: true,
			ellipsis: true,
			render: (_, record) => (
				console.log("record", record),
					<Space>
						{record.text}
					</Space>

			),
		},
		{
			title: '文本1',
			dataIndex: 'file.ctime',
			filters: true,
			onFilter: true,
			ellipsis: true,
			render: (_, record) => (
				console.log("record", record),
					<Space>
						{record.text}
					</Space>

			),
		},
	];

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
							created_at: [values.startTime, values.endTime],
						};
					}
					return values;
				},
			}}
			pagination={{
				pageSize: 10,
				onChange: (page) => console.log(page),
			}}
			headerTitle="高级表格"
			request={async (params, sort, filter) => {
				console.log('params:', params);
				const response = await executeTableQuery(dv, source, params);
				const {tableData, columns} = response;
				console.log("columnsData", columns);
				console.log("tableData", tableData);
				setColumns(columns);
				return Promise.resolve({
					data: tableData,
					success: true,
					total: tableData.length,
					//	columns: columns,
				});
			}}
			toolBarRender={() => [
				// <Button
				// 	key="button"
				// 	icon={<PlusOutlined/>}
				// 	onClick={() => {
				// 		actionRef.current?.reload();
				// 	}}
				// 	type="primary"
				// >
				// 	新建
				// </Button>,
				// <Dropdown
				// 	key="menu"
				// 	menu={{
				// 		items: [
				// 			{
				// 				label: '1st item',
				// 				key: '1',
				// 			},
				// 			{
				// 				label: '2nd item',
				// 				key: '2',
				// 			},
				// 			{
				// 				label: '3rd item',
				// 				key: '3',
				// 			},
				// 		],
				// 	}}
				// >
				// 	<Button>
				// 		<EllipsisOutlined/>
				// 	</Button>
				// </Dropdown>,
			]}
		/>
	);
};
export default TableView;
