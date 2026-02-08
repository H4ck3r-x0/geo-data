import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GeoDataConfig } from "./config.js";

vi.mock("fs-extra", () => ({
  default: {
    readdir: vi.fn(),
    writeFile: vi.fn(),
  },
}));

vi.mock("./helpers.js", () => ({
  getInstalledCountries: vi.fn(),
}));

function makeConfig(overrides: Partial<GeoDataConfig> = {}): GeoDataConfig {
  return {
    outputDir: "./src/data/geo",
    languages: ["en"],
    includeCoordinates: true,
    typescript: true,
    ...overrides,
  };
}

describe("generateIndex", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates correct TypeScript output with countries", async () => {
    const { getInstalledCountries } = await import("./helpers.js");
    const fs = await import("fs-extra");
    vi.mocked(getInstalledCountries).mockResolvedValue(["ae", "sa"]);
    vi.mocked(fs.default.writeFile).mockResolvedValue();

    const { generateIndex } = await import("./codegen.js");
    const config = makeConfig({ typescript: true });
    await generateIndex(config);

    expect(fs.default.writeFile).toHaveBeenCalledOnce();
    const [filePath, content] = vi.mocked(fs.default.writeFile).mock.calls[0] as [string, string];

    expect(filePath).toContain("index.ts");
    expect(content).toMatchSnapshot();
  });

  it("generates correct JavaScript output", async () => {
    const { getInstalledCountries } = await import("./helpers.js");
    const fs = await import("fs-extra");
    vi.mocked(getInstalledCountries).mockResolvedValue(["us"]);
    vi.mocked(fs.default.writeFile).mockResolvedValue();

    const { generateIndex } = await import("./codegen.js");
    const config = makeConfig({ typescript: false });
    await generateIndex(config);

    const [filePath, content] = vi.mocked(fs.default.writeFile).mock.calls[0] as [string, string];

    expect(filePath).toContain("index.js");
    expect(content).toMatchSnapshot();
  });

  it("handles empty directory", async () => {
    const { getInstalledCountries } = await import("./helpers.js");
    const fs = await import("fs-extra");
    vi.mocked(getInstalledCountries).mockResolvedValue([]);
    vi.mocked(fs.default.writeFile).mockResolvedValue();

    const { generateIndex } = await import("./codegen.js");
    const config = makeConfig({ typescript: true });
    await generateIndex(config);

    const [filePath, content] = vi.mocked(fs.default.writeFile).mock.calls[0] as [string, string];

    expect(filePath).toContain("index.ts");
    expect(content).toMatchSnapshot();
  });

  it("handles empty directory in JavaScript mode", async () => {
    const { getInstalledCountries } = await import("./helpers.js");
    const fs = await import("fs-extra");
    vi.mocked(getInstalledCountries).mockResolvedValue([]);
    vi.mocked(fs.default.writeFile).mockResolvedValue();

    const { generateIndex } = await import("./codegen.js");
    const config = makeConfig({ typescript: false });
    await generateIndex(config);

    const [filePath, content] = vi.mocked(fs.default.writeFile).mock.calls[0] as [string, string];

    expect(filePath).toContain("index.js");
    expect(content).toMatchSnapshot();
  });

  it("contains helper functions for getting regions", async () => {
    const { getInstalledCountries } = await import("./helpers.js");
    const fs = await import("fs-extra");
    vi.mocked(getInstalledCountries).mockResolvedValue(["sa"]);
    vi.mocked(fs.default.writeFile).mockResolvedValue();

    const { generateIndex } = await import("./codegen.js");
    await generateIndex(makeConfig());

    const [, content] = vi.mocked(fs.default.writeFile).mock.calls[0] as [string, string];

    expect(content).toMatchSnapshot();
  });
});
