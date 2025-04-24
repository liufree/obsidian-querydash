import {ProList} from '@ant-design/pro-components';
import React, {useEffect, useState} from "react";
import {formatValue} from "../GenerateColumns";
import {getAPI} from 'obsidian-dataview';
import {ViewProps} from "../../models/ViewProps";
import {Radio, RadioChangeEvent, Timeline, Typography} from "antd";
import {TFile} from "obsidian";


const TimeLineView: React.FC<ViewProps> = ({app, source}) => {

	const [data, setData] = React.useState<any>([]);

	const dv = getAPI(app);
	const [mode, setMode] = useState<'left' | 'alternate' | 'right'>('alternate');

	const {Text, Link} = Typography;


	const onChange = (e: RadioChangeEvent) => {
		setMode(e.target.value);
	};

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
					style={display ? {maxWidth: 300, color: '#1890ff'} : {color: '#1890ff'}}
					ellipsis={{expanded: true}}
				>
					{display}
				</Text>
			</Link>
		);
	};

	const renderItem = (itemFile: any, itemCtime: any) => {
		const date = itemCtime?.display.split(" ")[0] || "";

		return (
			<span>
				{ellipsisLink(itemFile.display, itemFile.path)}
				{date ? "  " + date : ""}
			</span>
		)
	}

	useEffect(() => {

		let resData: any[] = [];

		const response = executeTableQuery(dv, source, {});

		response.then((res) => {
			const {tableData} = res;
			tableData.forEach((item: any) => {
				const file = item["File"];
				const ctime = item["time"];
				const finalDisplay = renderItem(file, ctime);
				resData.push({"children": finalDisplay});
			});
			setData(resData);
		}).catch((error) => {
			console.error("Error executing query:", error);
		});
		//	console.log(response, response);

	}, [app, source]);

	function parseTableResult(value: any, params: any): Array<Record<string, any>> {
		const headers: string[] = value.headers;
		const rows: Array<Record<string, any>> = [];
		value.values.forEach((row: any) => {
			const values: Record<string, any> = {};
			headers.forEach((header, index) => {
				const value = row[index];
				//	console.log("list value", value);
				const resValue = formatValue(value);
				//	console.log("list resValue", resValue);
				values[header] = resValue;
			});
			rows.push(values);
		});		// console.log("list rows", rows);

		return rows;
	}

	function replaceFirstWord(source: string): string {
		const words = source.split(' ');
		if (words[0] === 'timeline') {
			words[0] = 'table';
		}
		return words.join(' ');
	}

	const executeTableQuery = async (dvApi: any, source: any, params: any) => {
		const sql = replaceFirstWord(source);
		const queryResult = await dvApi.query(sql);
		const tableData: any = parseTableResult(queryResult.value, params);
		return {tableData: tableData};

	}


	return (
		<>
			<h4>Timeline</h4>
			<br/>
			<Radio.Group
				onChange={onChange}
				value={mode}
				style={{
					marginBottom: 20,
				}}
			>
				<Radio value="left">Left</Radio>
				<Radio value="right">Right</Radio>
				<Radio value="alternate">Alternate</Radio>
			</Radio.Group>
			<Timeline
				mode={mode}
				items={data}
			/>
		</>)
}

export default TimeLineView;
