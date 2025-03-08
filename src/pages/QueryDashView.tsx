
import {EllipsisOutlined, PlusOutlined} from '@ant-design/icons';
import type {ActionType, ProColumns} from '@ant-design/pro-components';
import {ProTable, TableDropdown} from '@ant-design/pro-components';
import {Button, Dropdown, Space, Tag} from 'antd';
import {useEffect, useRef} from 'react';
import React from 'react';
import request from 'umi-request';
import { getAPI} from 'obsidian-dataview';
import {App, Workspace} from "obsidian";
import {continuedIndent} from "@codemirror/language";

export const waitTimePromise = async (time: number = 100) => {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(true);
		}, time);
	});
};

export const waitTime = async (time: number = 100) => {
	await waitTimePromise(time);
};

type GithubIssueItem = {
	url: string;
	id: number;
	number: number;
	title: string;
	labels: {
		name: string;
		color: string;
	}[];
	state: string;
	comments: number;
	created_at: string;
	updated_at: string;
	closed_at?: string;
	header: {
		path: string;
	},
	text: string;
};


interface MyReactComponentProps {
	app: any; // Obsidian的App对象
	source: string; // 当前文件的路径
}

const MyReactComponent: React.FC<MyReactComponentProps> = ({app, source}) => {
	const actionRef = useRef<ActionType>();

	const dv = getAPI(app);

	const [data, setData] = React.useState<GithubIssueItem[]>([]);

	function parseTableResult(value: any, params:any): Array<Record<string, any>> {
		const headers: string[] = value.headers;

		const rows: Array<Record<string, any>> = [];
		console.log("params1", params);



		value.values.forEach((row) => {
			const values: Record<string, any> = {};

			let flag = []
			headers.forEach((header, index) => {

				const searchParam = params[header];
				console.log("searchParam",searchParam);


				const value = row[index];
				// 如果字符串value中不包含searchParam，则排除
				if(searchParam){
					flag[index] = value.indexOf(searchParam) > -1;
				}else{
					flag[index] = true;
				}

				console.log("header",header)
				console.log("row.value",value)
				values[header] = value;
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
					}else{
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

	const  executeTableQuery=async (dvApi: any,source:any,params:any) => {
		// 定义查询语句
		const sql = source;

		// 使用 Dataview API 执行查询
		const queryResult = await dvApi.query(sql);
		console.log("Query Result:", queryResult);
		console.log("Query Result1:", queryResult.successful);
		console.log("Query Result2:", queryResult.value);

		const tableData:any =parseTableResult(queryResult.value,params);


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
		return tableData;

	}

	useEffect(() => {

		//executeTableQuery(dv,source,{});

	//	const data = dv.pages().file.lists.values;
		//console.log("data", data);
	//	setData(data);
	}, []);

	const columns: ProColumns<GithubIssueItem>[] = [
		{
			dataIndex: 'index',
			valueType: 'indexBorder',
			width: 48,
		},
		{
			title: '标题',
			dataIndex: 'file.name',
			render: (_, record) => (
				console.log("record,{},text", _,record),
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
		<ProTable<GithubIssueItem>
			columns={columns}
			actionRef={actionRef}
			cardBordered
			editable={{
				type: 'multiple',
			}}
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
				pageSize: 5,
				onChange: (page) => console.log(page),
			}}
			dateFormatter="string"
			headerTitle="高级表格"
			request={async (params, sort, filter) => {
				console.log('params:', params);
				const response = await executeTableQuery(dv,source,params);
				console.log("response1",response);
				return {
					data: response,
					success: true,
					total: response.length,
				};
			}}
			toolBarRender={() => [
				<Button
					key="button"
					icon={<PlusOutlined/>}
					onClick={() => {
						actionRef.current?.reload();
					}}
					type="primary"
				>
					新建
				</Button>,
				<Dropdown
					key="menu"
					menu={{
						items: [
							{
								label: '1st item',
								key: '1',
							},
							{
								label: '2nd item',
								key: '2',
							},
							{
								label: '3rd item',
								key: '3',
							},
						],
					}}
				>
					<Button>
						<EllipsisOutlined/>
					</Button>
				</Dropdown>,
			]}
		/>
	);
};
export default MyReactComponent;
