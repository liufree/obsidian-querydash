import {EllipsisOutlined, PlusOutlined} from '@ant-design/icons';
import type {ActionType, ProColumns} from '@ant-design/pro-components';
import {ProTable, TableDropdown} from '@ant-design/pro-components';
import {Button, Dropdown, Space, Tag} from 'antd';
import {useEffect, useRef} from 'react';
import React from 'react';
import request from 'umi-request';
import { getAPI } from 'obsidian-dataview';
// import 'antd/dist/antd.css';

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

const columns: ProColumns<GithubIssueItem>[] = [
	{
		dataIndex: 'index',
		valueType: 'indexBorder',
		width: 48,
	},
	{
		title: '标题',
		render: (_, record) => (
			<Space>
				{record.header.path}
			</Space>
		),
	},
	{
		title: '文本',
		dataIndex: 'text',
		filters: true,
		onFilter: true,
		ellipsis: true,
		render: (_, record) => (
			console.log("record",record),
			<Space>
				{record.text}
			</Space>

		),
	},
];

export default () => {
	const actionRef = useRef<ActionType>();

	const dataviewAPI = getAPI();

	const [data, setData] = React.useState<GithubIssueItem[]>([]);

	useEffect(() => {

		const data = dataviewAPI.pages().file.lists.values;
		console.log("data",data);
		setData(data);
	}, []);

	return (
		<ProTable<GithubIssueItem>
			columns={columns}
			actionRef={actionRef}
			cardBordered
			editable={{
				type: 'multiple',
			}}
			dataSource={data}
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
			rowKey="id"
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
