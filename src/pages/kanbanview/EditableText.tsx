import React, {useState} from "react";
import {Input, Typography} from "antd";
import {EditOutlined} from "@ant-design/icons";
import {TFile} from "obsidian";

const {Text, Link} = Typography;


const EditableText: React.FC<{ app: any, item: any; onSave: (newText: string) => void; }> = ({app, item, onSave}) => {
	const [isEditing, setIsEditing] = useState(false);
	const [editableText, setEditableText] = useState(item.text);

	const handleSave = () => {
		setIsEditing(false);
		onSave(editableText); // 保存编辑后的值
	};

	const getSelectionState = (item: any) => {
		const selectionState = {
			eState: {
				cursor: {
					from: {line: item.line, ch: item.position.start.col},
					to: {line: item.line + item.lineCount - 1, ch: item.position.end.col},
				},
				line: item.line,
			},
		};
		return selectionState;
	};

	const ellipsisLink = (item: any, display: string, path: string) => (
		<Link
			onClick={() => {
				const selectionState = getSelectionState(item);
// MacOS interprets the Command key as Meta.
				app.workspace.openLinkText(
					item.link.toFile().obsidianLink(),
					item.path,
					false,
					selectionState as any
				);
				/*const file = app.vault.getAbstractFileByPath(path);
				if (file && file instanceof TFile) {
					const leaf = app.workspace.getLeaf();
					leaf.openFile(file);
				}*/
			}}
		>
			<Text
				ellipsis={{expanded: true}}
			>
				{display}
			</Text>

		</Link>
	);

	return isEditing ? (
		<Input
			value={editableText}
			onChange={(e) => setEditableText(e.target.value)}
			onBlur={handleSave} // 失去焦点时保存
			onPressEnter={handleSave} // 按下回车时保存
			autoFocus
		/>
	) : (
		<div style={{display: "flex"}}>
			{ellipsisLink(item, editableText, item.path)}
			<EditOutlined
				style={{marginLeft: 8, cursor: "pointer"}}
				onClick={() => setIsEditing(true)} // 点击图标进入编辑模式
			/>
		</div>
	);
};

export default EditableText;
