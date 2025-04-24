


**项目目标**  
QueryDash的目标是开发一款类似Notion Database的Obsidian插件，但不仅限于数据库功能。
**由于使用了dataview的api，必须启用dataview插件。**
未来将逐步扩展更多实用特性，帮助用户更高效地管理知识、任务和生活。

**现有功能**
1. **多视图支持**：提供表格和列表两种视图，满足不同场景需求。
	- **时间轴视图**: 使用时间轴来展示数据
2. **Dataview SQL支持**：兼容Dataview的SQL语法。
3. **增强功能**：
	- **搜索**：快速定位所需内容。
	- **过滤**：根据条件筛选数据。
	- **合计**：支持数据汇总统计。
	- **分页**：优化大数据量下的浏览体验。

**使用教程**


~~~markdown
```querydash
table file.name , file.outlinks as "links" ,file.ctime as "ctime",
file.mtime as "mtime" ,file.tags as "tags" from #clippings
```
~~~

![demo.gif](docs/demo.gif)

**timeline**

**simple mode**
~~~markdown
```querydash
timeline  from #start
```
~~~
![timeline.png](docs/timeline.png)
**full mode**

If you want to append the time later, alias a specific field as "time".
~~~markdown
```querydash
timeline file.ctime as "time" from #start where file.ctime<=date(today) sort file.mtime desc
```
~~~


**远景规划**
1. **首页**：将常用功能整合到首页，提供一站式便捷操作。
2. **多视图支持**：支持时间线、画廊、表格等多种视图，满足不同场景需求。
3. **复习卡片**：内置复习功能，帮助用户高效巩固知识。
4. **Database功能**：支持创建、编辑、删除等操作，打造灵活的数据管理体验。
5. **更多功能**：持续开发，不断丰富插件功能，提升用户体验。

**参考项目**
- [Dataview](https://github.com/blacksmithgu/obsidian-dataview)：强大的数据查询和管理工具。
- [Project](https://github.com/marcusolsson/obsidian-projects)：任务和项目管理插件。

**项目简介**  
作为一名Obsidian的深度用户，我发现现有的插件在搜索、复习以及Dataview表格的编辑和删除等功能上无法完全满足我的需求。因此，我决定基于Ant Design开发一套全新的视图系统，旨在提升Obsidian的使用体验，更好地辅助日常生活和工作。

目前，项目的功能还处于初期阶段，但我会持续投入开发，逐步完善和扩展功能。我相信通过不断迭代，这个项目会变得越来越实用和强大。

**关于赞助**  
本项目完全基于个人兴趣开发，如果您觉得这个项目对您有帮助，并愿意支持我的工作。您的每一份赞助都将成为我持续开发的动力，非常感谢！

**未来计划**
- 完善现有功能，提升用户体验
- 增加更多实用特性，如高级搜索、智能复习等
- 优化性能，确保系统稳定运行
