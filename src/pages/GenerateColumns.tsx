import {TFile} from "obsidian";
import React from "react";
import {Typography} from "antd";

const {Text, Link} = Typography;

export function formatValue(
	value: Record<string, any>
) {
	let res;
	if (!value) {
		return;
	}
//	console.log("format value", value);
	if (Array.isArray(value)) {
		const formattedValues = value.map((v) => (typeof v === "object" ? formatObject(v) : v));
		res = {type: "array", display: formattedValues};
	} else if (typeof value === "object") {
		res = formatObject(value);
	} else {
		res = {type: "text", display: value};
	}
	return res;
}

function formatObject(value: any) {
	const type = value.type;
	if (type === 'file') {
		const fileName = value.path.split('/').pop().replace(/\.md$/, '')
		return {type: "link", path: value.path, display: fileName};
	}

	if ("path" in value && "display" in value) {
		//	console.log("link value", value);
		return {type: "link", path: value.path, display: value.display};
	}
	if ("ts" in value) {
		const display = window.moment(value.ts).format("YYYY-MM-DD HH:mm:ss");
		return {type: "datetime", display: display};
	}
	if (value.url) {
		return {type: "externalLink", path: value.url, display: value.display || value.url};
	}

	return {type: "text", display: value.display};
}

export const ellipsisLink = (app: any, display: string, path: any) => {
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
				ellipsis={{expanded: true}}
			>
				{display}
			</Text>
		</Link>
	);
};

export const ellipsisDisplay = (display: string) => {
	return (
		<Text
			style={display ? {maxWidth: 300} : undefined}
			ellipsis={{expanded: true}}
		>
			{display?.toString()}
		</Text>
	);
};

export const externalLink = (display: string, path: string) => {
	// 在obsidian中打开外部链接
	return <Link
		onClick={() => {
			window.open(path, "_blank");
		}}>
		<Text
			style={display ? {maxWidth: 200, color: '#1890ff'} : {color: '#1890ff'}}
			ellipsis={{expanded: true}}
		>
			{display}
		</Text>
	</Link>;
}

