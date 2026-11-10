import { Plugin } from "@opencode/plugin"

// Server part. The id is also the GUI plugin id, so the desktop host and
// command palette show the same name. The GUI part does the actual work.
export default Plugin.define({
  id: "opencode-prompt-rail",
  setup() {},
})
