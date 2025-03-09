import React, {useEffect} from 'react';
import {App} from "obsidian";
import TableView from "./tableview/TableView";
import ListView from "./listview/ListView";
import {ConfigProvider, ConfigProviderProps} from "antd";
import enUS from 'antd/locale/en_US';


interface QueryDashViewDashs {
	app: App; // Obsidian app
	source: string;
}


const QueryDashView: React.FC<QueryDashViewDashs> = ({app, source}) => {


	const [sourceType, setSourceType] = React.useState<string>("table");

	useEffect(() => {
		const sourceType = source.toLowerCase().startsWith("list") ? "list" : "table";
		setSourceType(sourceType);
	}, []);

	const getView = (app: App, source: string) => {
		if (sourceType === "table") {
			return <TableView app={app} source={source}/>;
		} else {
			return <ListView app={app} source={source}/>;
		}
	}

	return (
		<ConfigProvider locale={enUS}>
			{getView(app, source)}
		</ConfigProvider>
	)

};
export default QueryDashView;
