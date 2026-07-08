# 来源与采集路线

## 一手来源

### 微博
- 官方主页：https://weibo.com/acetaffy
- 首选路线：m.weibo.cn 官方移动站访客态抓取
- 本地采集脚本：tools/collect_weibo.py

### Bilibili
- 空间：https://space.bilibili.com/1265680561
- 直播间：https://live.bilibili.com/22603245
- 首选元数据脚本：tools/collect_bilibili.py

## 数据优先级
### P0 - 微博原创正文、B站官方视频标题/简介/评论、B站官方视频转录
### P1 - B站官方动态、官方直播间标题/公告、官方视频评论区高赞互动
### P2 - 授权切片、粉丝评论、RSS订阅式增量同步

## 这轮实际计数
- 微博公开正文：658 条
- 微博转发文案：102 条
- Bilibili 视频详情：180 条
- Bilibili 空间动态：149 条
- 直播间公开信息：1 条
- 当前公开 source corpus：1090 条

## 恢复说明
- tools/source_refresh_public.py 会写 _collector_state.json
- 中途断开可保留中间产物后继续续跑
