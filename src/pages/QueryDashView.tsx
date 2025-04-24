import React, {useEffect} from 'react';
import {App} from "obsidian";
import TableView from "./tableview/TableView";
import ListView from "./listview/ListView";
import {ConfigProvider, ConfigProviderProps, Timeline} from "antd";
import enUS from 'antd/locale/en_US';
import TimeLineView from "./timelineview/TimeLineView";


interface QueryDashViewDashs {
	app: App; // Obsidian app
	source: string;
}


const QueryDashView: React.FC<QueryDashViewDashs> = ({app, source}) => {


	const [sourceType, setSourceType] = React.useState<string>("table");

	useEffect(() => {
		// 获取第一个单词
		const sourceType = source.split(" ")[0].toLowerCase();
		setSourceType(sourceType);
	}, []);

	const getView = (app: App, source: string) => {
		if (sourceType === "table") {
			return <TableView app={app} source={source}/>;
		} else if (sourceType === "list") {
			return <ListView app={app} source={source}/>;
		} else if (sourceType === "timeline") {
			return <TimeLineView app={app} source={source}/>;
		}
	}

	return (
		<ConfigProvider locale={enUS}>
			{getView(app, source)}
		</ConfigProvider>
	)

};
export default QueryDashView;
