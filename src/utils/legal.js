/**
 * Initialize legal modal popup
 * @returns {object} Object containing legal control functions
 */
export function initLegal() {
    const btnLegal = document.getElementById('btn-about');
    const legalModal = document.getElementById('about-modal');
    const acceptBtn = document.getElementById('about-accept');

    /**
     * Open the about modal
     */
    function openAbout() {
        legalModal.classList.remove('hidden');
            window.umami?.track('modal-open', { 
            type: 'About'})
        };


    /**
     * Close the about modal and mark consent as accepted
     */
    function acceptAbout() {
        legalModal.classList.add('hidden');
        localStorage.setItem('aboutAccepted', 'true');
    }

    // Attach event listeners
    btnLegal.addEventListener('click', openAbout);
    acceptBtn.addEventListener('click', acceptAbout);

    // Return public API
    return {
        openAbout,
        acceptAbout
    };
}
