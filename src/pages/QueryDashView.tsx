import React, {useEffect} from 'react';
import {App} from "obsidian";
import TableView from "./tableview/TableView";
import ListView from "./listview/ListView";


interface QueryDashViewDashs {
	app: App; // Obsidian app
	source: string;
}

const QueryDashView: React.FC<QueryDashViewDashs> = ({app, source}) => {


	const [sourceType, setSourceType] = React.useState<string>("table");

	useEffect(() => {
		// source如果是List开头，则sourceType为List，否则为Table
		const sourceType = source.toLowerCase().startsWith("list") ? "list" : "table";
		setSourceType(sourceType);
	}, []);

	if (sourceType === "table") {
		return <TableView app={app} source={source}/>;
	} else {
		return <ListView app={app} source={source}/>;
	}
};
export default QueryDashView;
