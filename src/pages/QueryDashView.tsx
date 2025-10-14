import React, {useEffect, useState} from 'react';
import {App} from "obsidian";
import TableView from "./tableview/TableView";
import ListView from "./listview/ListView";
import {ConfigProvider, theme} from "antd";
import enUS from 'antd/locale/en_US';
import TimeLineView from "./timelineview/TimeLineView";
import KanbanView from "./kanbanview/KanbanView";

interface QueryDashViewDashs {
	app: App; // Obsidian app
	source: string;
}

const QueryDashView: React.FC<QueryDashViewDashs> = ({app, source}) => {
	const [sourceType, setSourceType] = useState<string>("table");
	const [isDarkTheme, setIsDarkTheme] = useState<boolean>(
		document.body.classList.contains("theme-dark")
	);

	useEffect(() => {
		// Detect Obsidian's theme
		const updateTheme = () => {
			const isDark = document.body.classList.contains("theme-dark");
			setIsDarkTheme(isDark);
		};

		// Initial theme detection
		updateTheme();

		// Listen for theme changes
		const observer = new MutationObserver(updateTheme);
		observer.observe(document.body, {attributes: true, attributeFilter: ["class"]});

		return () => observer.disconnect();
	}, []);

	useEffect(() => {
		// Get the first word of the source
		let sourceType = source.match(/^\s*(\S+)/)?.[1] ?? '';
		sourceType = sourceType.toLowerCase();

		setSourceType(sourceType);
	}, [source]);

	const getView = (app: App, source: string) => {
		if (sourceType === "table") {
			return <TableView app={app} source={source}/>;
		} else if (sourceType === "list") {
			return <ListView app={app} source={source}/>;
		} else if (sourceType === "timeline") {
			return <TimeLineView app={app} source={source}/>;
		}
		/*else if (sourceType === "task") {
			return <KanbanView app={app} source={source}/>;
		}*/
	};

	return (
		<ConfigProvider
			locale={enUS}
			theme={{
				algorithm: isDarkTheme ? theme.darkAlgorithm : theme.defaultAlgorithm,
				// token: {
				// 	colorPrimary: isDarkTheme ? "#1E90FF" : "#1890FF", // 自定义主色
				// 	colorBgBase: isDarkTheme ? "#1F1F1F" : "#FFFFFF", // 自定义背景色
				// 	colorText: isDarkTheme ? "#E0E0E0" : "#000000",  // 自定义文本颜色
				// },
			}}
		>
			{getView(app, source)}
		</ConfigProvider>
	);
};

export default QueryDashView;
