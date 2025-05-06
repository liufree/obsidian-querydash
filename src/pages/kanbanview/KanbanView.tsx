import React, {useEffect, useState} from "react";
import {ProCard} from "@ant-design/pro-components";
import {Checkbox, CheckboxChangeEvent, CheckboxProps, Typography} from "antd";
import {getAPI, STask} from "obsidian-dataview";
import {ViewProps} from "../../models/ViewProps";
import {TFile, Vault} from "obsidian";

const {Text, Link} = Typography;

const KanbanView: React.FC<ViewProps> = ({app, source}) => {
	const [columns, setColumns] = useState<any[]>([]);
	const [refresh, setRefresh] = useState(false);
	const dv = getAPI(app);

	const ellipsisLink = (display: string, path: string) => (
		<Link
			onClick={() => {
				const file = app.vault.getAbstractFileByPath(path);
				if (file && file instanceof TFile) {
					const leaf = app.workspace.getLeaf();
					leaf.openFile(file);
				}
			}}
		>
			<Text ellipsis>{display}</Text>
		</Link>
	);

	const parseTaskData = (value: any) => {
		const tasks = value.values || [];
		const groupedTasks: Record<string, any[]> = {
			done: [],
			doing: [],
			todo: [],
		};

		tasks.forEach((task: any) => {
			const status = task.status === "x" ? "done" : task.status === "?" ? "doing" : "todo";
			groupedTasks[status].push({
				...task,
				type: "link",
			});
		});

		return Object.keys(groupedTasks).map((status) => ({
			title: status.toUpperCase(),
			items: groupedTasks[status],
		}));
	};

	const executeTaskQuery = async (dvApi: any, source: any) => {
		const queryResult = await dvApi.query(source);
		console.log("queryResult", queryResult);
		if (queryResult.successful) {
			return parseTaskData(queryResult.value);
		}
		return [];
	};

	const onChange: (e: CheckboxChangeEvent, item: STask) => void = async (e, item) => {
		console.log("completed", e.target.checked);
		console.log("item", item);
		const completed = e.target.checked;
		const status = completed ? "x" : " ";
		console.log("status", status);
		let updatedText: string = item.text;
		await rewriteTask(app.vault, item, status, updatedText)
		setRefresh(true)
	};


	const LIST_ITEM_REGEX = /^[\s>]*(\d+\.|\d+\)|\*|-|\+)\s*(\[.{0,1}\])?\s*(.*)$/mu;

	/** Rewrite a task with the given completion status and new text. */
	async function rewriteTask(vault: Vault, task: STask, desiredStatus: string, desiredText?: string) {
		if (desiredStatus == task.status && (desiredText == undefined || desiredText == task.text)) return;
		desiredStatus = desiredStatus == "" ? " " : desiredStatus;

		let rawFiletext = await vault.adapter.read(task.path);

		console.log("rawFiletext", rawFiletext);

		let hasRN = rawFiletext.contains("\r");
		let filetext = rawFiletext.split(/\r?\n/u);
		console.log("filetext", filetext);

		if (filetext.length < task.line) {
			console.log("line", filetext);
			return;
		}

		let match = LIST_ITEM_REGEX.exec(filetext[task.line]);
		if (!match || match[2].length == 0) {
			console.log("match", match);
			return;
		}

		let taskTextParts = task.text.split("\n");
		if (taskTextParts[0].trim() != match[3].trim()) {
			console.log("taskTextParts", taskTextParts);
			return;
		}

		// We have a positive match here at this point, so go ahead and do the rewrite of the status.
		let initialSpacing = /^[\s>]*/u.exec(filetext[task.line])!![0];
		if (desiredText) {
			let desiredParts = desiredText.split("\n");

			let newTextLines: string[] = [`${initialSpacing}${task.symbol} [${desiredStatus}] ${desiredParts[0]}`].concat(
				desiredParts.slice(1).map(l => initialSpacing + "\t" + l)
			);

			filetext.splice(task.line, task.lineCount, ...newTextLines);
		} else {
			filetext[task.line] = `${initialSpacing}${task.symbol} [${desiredStatus}] ${taskTextParts[0].trim()}`;
		}

		let newText = filetext.join(hasRN ? "\r\n" : "\n");
		console.log("newText", newText);
		console.log("taskPath", task.path);
		await vault.adapter.write(task.path, newText);
	}


	useEffect(() => {
		executeTaskQuery(dv, source)
			.then((data) => setColumns(JSON.parse(JSON.stringify(data))))
			.catch((error) => console.error("Error executing query:", error));
	}, [app, source, refresh]);

	return (
		<ProCard ghost gutter={8}>
			{columns.map((column) => (
				<ProCard key={column.title} title={column.title} bordered>
					{column.items.map((item: any, index: number) => (
						<>
							<ProCard key={index} bordered>
								<Checkbox onChange={(e) => onChange(e, item)} checked={item.checked}>
									{item.type === "link"
										? ellipsisLink(item.text, item.path)
										: <Text>{item.text}</Text>}
								</Checkbox>
							</ProCard>
						</>
					))}
				</ProCard>
			))}
		</ProCard>
	);
};

export default KanbanView;
