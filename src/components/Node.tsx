import {Badge, Box, Card, Flex, IconButton, Separator, Text,} from "@radix-ui/themes";
import type {LiveData, Record} from "../types/LiveData";
import UsageBar from "./UsageBar";
import Flag from "./Flag";
import {useTranslation} from "react-i18next";
import Tips from "./ui/tips";
import type {TFunction} from "i18next";
import {Link} from "react-router-dom";
import {useIsMobile} from "@/hooks/use-mobile";
import type {NodeBasicInfo} from "@/contexts/NodeListContext";
import PriceTags from "./PriceTags";
import {TrendingUp} from "lucide-react";
import MiniPingChartFloat from "./MiniPingChartFloat";
import {getOSImage, getOSName} from "@/utils";
// import {node} from "globals";

/** 将字节转换为人类可读的大小 */

/** 格式化秒*/
export function formatUptime(seconds: number, t: TFunction): string {
  if (!seconds || seconds < 0) return t("nodeCard.time_second", {val: 0});
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts = [];
  if (d) parts.push(`${d} ${t("nodeCard.time_day")}`);
  if (h) parts.push(`${h} ${t("nodeCard.time_hour")}`);
  if (m) parts.push(`${m} ${t("nodeCard.time_minute")}`);
  if (s || parts.length === 0) parts.push(`${s} ${t("nodeCard.time_second")}`);
  return parts.join(" ");
}

export function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

export function getDaysRemaining(nodeInfo: NodeBasicInfo): number {
  return Math.floor((Date.parse(nodeInfo.expired_at) - Date.now()) / (1000 * 60 * 60 * 24));
}

export function remainColor(remainDay: number): "green" | "yellow" | "red" {
  if (remainDay > 7) {
    return "green";
  } else if (remainDay > 0) {
    return "yellow";
  }
  return "red";
}

export function cycleBilling(nodeInfo: NodeBasicInfo): "月" | "季" | "半年" | "年" | "两年" | "三年" | "五年" | "一次性" {
  const time = nodeInfo.billing_cycle;
  if (time == 30) {
    return "月";
  } else if (time == 92) {
    return "季";
  } else if (time == 180) {
    return "半年";
  } else if (time == 365) {
    return "年";
  } else if (time == 730) {
    return "两年";
  } else if (time == 1095) {
    return "三年";
  } else if (time == 1825) {
    return "五年";
  }
  return "一次性";
}

interface NodeProps {
  basic: NodeBasicInfo;
  live: Record | undefined;
  online: boolean;
}

const Node = ({basic, live, online}: NodeProps) => {
  const [t] = useTranslation();
  const isMobile = useIsMobile();
  const defaultLive = {
    cpu: {usage: 0},
    ram: {used: 0},
    disk: {used: 0},
    network: {up: 0, down: 0, totalUp: 0, totalDown: 0},
  } as Record;

  const liveData = live || defaultLive;

  const memoryUsagePercent = basic.mem_total
    ? (liveData.ram.used / basic.mem_total) * 100
    : 0;
  const diskUsagePercent = basic.disk_total
    ? (liveData.disk.used / basic.disk_total) * 100
    : 0;

  const uploadSpeed = formatBytes(liveData.network.up);
  const downloadSpeed = formatBytes(liveData.network.down);
  const totalUpload = formatBytes(liveData.network.totalUp);
  const totalDownload = formatBytes(liveData.network.totalDown);
  //const totalTraffic = formatBytes(liveData.network.totalUp + liveData.network.totalDown);
  return (
    <Card
      style={{
        width: "100%",
        margin: "0 auto",
        transition: "all 0.2s ease-in-out",
      }}
      className="node-card hover:cursor-pointer hover:shadow-lg hover:bg-accent-2"
    >
      <Flex direction="column" gap="2">
        <Flex justify="between" align="center" my={isMobile ? "-1" : "0"}>
          <Flex justify="start" align="center">
            <Flag flag={basic.region}/>
            <Link to={`/instance/${basic.uuid}`}>
              <Flex direction="column">
                <Text
                  weight="bold"
                  size={isMobile ? "2" : "4"}
                  truncate
                  style={{maxWidth: "200px"}}
                >
                  {basic.name}
                </Text>
                <Text
                  color="gray"
                  hidden={!isMobile}
                  style={{
                    marginTop: "-3px",
                    fontSize: "0.728rem",
                  }}
                  className="text-sm"
                >
                  {formatUptime(liveData.uptime, t)}
                </Text>
                <PriceTags
                  hidden={isMobile}
                  price={basic.price}
                  billing_cycle={basic.billing_cycle}
                  expired_at={basic.expired_at}
                  currency={basic.currency}
                  tags={basic.tags}
                />
              </Flex>
            </Link>
          </Flex>
          <Flex gap="2" align="center">
            {live?.message && <Tips color="#CE282E">{live.message}</Tips>}
            <MiniPingChartFloat
              uuid={basic.uuid}
              hours={24}
              trigger={
                <IconButton variant="ghost" size="1">
                  <TrendingUp size="14"/>
                </IconButton>
              }
            />
            <Badge color={online ? "green" : "red"} variant="soft">
              {online ? t("nodeCard.online") : t("nodeCard.offline")}
            </Badge>
          </Flex>
        </Flex>

        <Separator size="4" className="-mt-1"/>

        <Flex direction="column" gap="2">
          <Flex justify="between" hidden={isMobile}>
            <Text size="2" color="gray">
              OS
            </Text>
            <Flex align="center">
              <img
                src={getOSImage(basic.os)}
                alt={basic.os}
                className="w-5 h-5 mr-2"
              />
              <Text size="2">{getOSName(basic.os)} / {basic.arch}</Text>
            </Flex>
          </Flex>
          <Flex className="md:flex-col flex-row md:gap-1 gap-4">
            {/* CPU Usage */}
            <UsageBar label={t("nodeCard.cpu")} value={liveData.cpu.usage}/>

            {/* Memory Usage */}
            <UsageBar label={t("nodeCard.ram")} value={memoryUsagePercent}/>
            <Text
              className="md:block hidden"
              size="1"
              color="gray"
              style={{marginTop: "-4px"}}
            >
              ({formatBytes(liveData.ram.used)} / {formatBytes(basic.mem_total)}
              )
            </Text>

            {/* Disk Usage */}
            <UsageBar label={t("nodeCard.disk")} value={diskUsagePercent}/>
            <Text
              size="1"
              className="md:block hidden"
              color="gray"
              style={{marginTop: "-4px"}}
            >
              ({formatBytes(liveData.disk.used)} /{" "}
              {formatBytes(basic.disk_total)})
            </Text>
          </Flex>

          <Flex justify="between" hidden={isMobile}>
            <Text size="2" color="gray">
              {t("nodeCard.networkSpeed")}
            </Text>
            <Text size="2">
              ↑ {uploadSpeed}/s ↓ {downloadSpeed}/s
            </Text>
          </Flex>

          <Flex justify="between" hidden={isMobile}>
            <Text size="2" color="gray">
              {t("nodeCard.totalTraffic")}
            </Text>
            <Text size="2">
              ↑ {totalUpload} ↓ {totalDownload}
            </Text>
          </Flex>
          <Flex justify="between" gap="2" hidden={!isMobile}>
            <Text size="2">{t("nodeCard.networkSpeed")}</Text>
            <Text size="2">
              ↑ {uploadSpeed}/s ↓ {downloadSpeed}/s
            </Text>
          </Flex>
          <Flex justify="between" gap="2" hidden={!isMobile}>
            <Text size="2">{t("nodeCard.totalTraffic")}</Text>
            <Text size="2">
              ↑ {totalUpload} ↓ {totalDownload}
            </Text>
          </Flex>
          <Flex justify="between" hidden={isMobile}>
            <Text size="2" color="gray">
              {t("nodeCard.uptime")}
            </Text>
            {online ? (
              <Text size="2">{formatUptime(liveData.uptime, t)}</Text>
            ) : (
              <Text size="2" color="gray">
                -
              </Text>
            )}
          </Flex>
        </Flex>
        <PriceTags
          hidden={!isMobile}
          price={basic.price}
          billing_cycle={basic.billing_cycle}
          expired_at={basic.expired_at}
          currency={basic.currency}
          tags={basic.tags || ""}
        />
      </Flex>
    </Card>
  );
};

export default Node;

type NodeGridProps = {
  nodes: NodeBasicInfo[];
  liveData: LiveData;
};

export const NodeGrid = ({nodes, liveData}: NodeGridProps) => {
  // 确保liveData是有效的
  const onlineNodes = liveData && liveData.online ? liveData.online : [];

  // 排序节点：先按在线/离线状态排序，再按权重排序（权重大的靠前）
  const sortedNodes = [...nodes].sort((a, b) => {
    const aOnline = onlineNodes.includes(a.uuid);
    const bOnline = onlineNodes.includes(b.uuid);

    // 如果一个在线一个离线，在线的排前面
    if (aOnline !== bOnline) {
      return aOnline ? -1 : 1;
    }

    // 都是在线或都是离线的情况下，按权重升序排序（权重大的在后面）
    return a.weight - b.weight;
  });

  return (
    <Box
      className="gap-2 md:gap-4"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        padding: "1rem",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {sortedNodes.map((node) => {
        const isOnline = onlineNodes.includes(node.uuid);
        const nodeData =
          liveData && liveData.data ? liveData.data[node.uuid] : undefined;

        return (
          <Node
            key={node.uuid}
            basic={node}
            live={nodeData}
            online={isOnline}
          />
        );
      })}
    </Box>
  );
};
