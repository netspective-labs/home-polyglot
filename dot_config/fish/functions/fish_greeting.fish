function fish_greeting
    # only show a greeting once per day by storing state in chezmoi's fishGreeting bucket;
    # you can reset the state using `chezmoi state delete-bucket --bucket=fishGreeting`
    set today "$(date "+%Y-%m-%d")"
    set fgKeyValue (chezmoi state get --bucket=fishGreeting --key="shown_$today")
    if test -z "$fgKeyValue"
        chezmoi state set --bucket=fishGreeting --key="shown_$today" --value "$(date)"
        printf "Welcome to %sNetspective Labs Home%s (%sNLH%s) %sPolyglot CLI%s %s$today%s\n" (set_color yellow) (set_color normal) (set_color --bold yellow) (set_color normal) (set_color --italics) (set_color normal) (set_color --dim) (set_color normal)
        printf "%sTODO: add nlh-doctor and other reminders, fixup chezmoi status message below, etc.\n%s" (set_color --dim) (set_color normal)

        # https://www.chezmoi.io/user-guide/daily-operations/#pull-the-latest-changes-from-your-repo-and-see-what-would-change-without-actually-applying-the-changes
        set_color --dim
        chezmoi git pull -- --autostash --rebase && chez status
        set_color normal
    end
end
