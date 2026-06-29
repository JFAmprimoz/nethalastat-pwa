export function initHint() {
    const popover = document.getElementById('hint-popover');

    function showHint() {
        popover.classList.remove('hidden');
    }

    function hideHint() {
        popover.classList.add('hidden');
    }

    return { showHint, hideHint };
}
