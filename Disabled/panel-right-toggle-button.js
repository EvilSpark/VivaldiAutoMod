// Moves Panel Toggle button to the right when Panel Position is set to "Right Side"

vivaldi.jdhooks.addStyle(`
#main.right + div .paneltogglefooter {
  order:100
}
`, "panel-right-toggle-button.js")

vivaldi.jdhooks.hookClass("toolbars_Toolbar", origClass => {
    const React = vivaldi.jdhooks.require("React")
    const ReactDom = vivaldi.jdhooks.require("ReactDOM")

    return class extends origClass {
        render() {
            let r = super.render()
            for (let child of r.props.children)
                if (child && child.props.name == "PanelToggle") this.jd_panel_right_toggle_refname = child.ref = child.ref || "jd_panel_right_toggle_ref"
            return r
        }

        componentDidMount() {
            if (super.componentDidMount) super.componentDidMount()
            const ref = this.refs[this.jd_panel_right_toggle_refname]
            if (ref) {
                let toggleButton = ReactDom.findDOMNode(ref)
                if (toggleButton)
                    toggleButton.classList.add("paneltogglefooter")
            }
        }
    }
})
