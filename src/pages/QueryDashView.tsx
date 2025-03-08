import React, {useEffect} from 'react';
import {App} from "obsidian";
import TableDemo from "./tableview/TableView";


interface QueryDashViewDashs {
	app: App; // Obsidian app
	source: string;
}

const QueryDashView: React.FC<QueryDashViewDashs> = ({app, source}) => {

	useEffect(() => {

	}, []);

	return (
		<TableDemo app={app} source={source}/>
	);
};
export default QueryDashView;
