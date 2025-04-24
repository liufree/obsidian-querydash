
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
	const type =value.type;
	if(type==='file') {
		const fileName = value.path.split('/').pop().replace(/\.md$/, '')
		return {type: "link", path: value.path, display: fileName};
	}

	if ("path" in value && "display" in value) {
	//	console.log("link value", value);
		return {type: "link", path: value.path, display: value.display};
	}
	if ("ts" in value) {
		const display= window.moment(value.ts).format("YYYY-MM-DD HH:mm:ss");
		return {type: "datetime", display: display};
	}
}
