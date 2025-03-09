import dayjs from "dayjs";

export function formatValue(
	value: Record<string, any>
) {
	let res;
	if (!value) {
		return;
	}
	if (Array.isArray(value)) {
		value.map((v) => (typeof v === "object" ? formatObject(v) : v));
		res = {type: "array", display: value};
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
		return {type: "link", path: value.path, display: value.path};
	}

	if ("path" in value && "display" in value) {
		console.log("link value", value);
		return {type: "link", path: value.path, display: value.display};
	}
	if ("ts" in value) {
		const display= dayjs(value.ts).format("YYYY-MM-DD HH:mm:ss");
		return {type: "datetime", display: display};
	}
}
