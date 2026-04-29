using UnityEngine;
using ProjectMayhem;
using TMPro;
using ProjectMayhem.Systems;
using ProjectMayhem.Player;

namespace ProjectMayhem.UI
{
    public class UIManager : MonoBehaviour
    {
        [Header("Status Elements")]
        public TextMeshProUGUI SanityText;
        public TextMeshProUGUI PersonalityText;
        public TextMeshProUGUI StaminaText;
        public TextMeshProUGUI ReputationText;
        public TextMeshProUGUI HeatText;
        
        [Header("Overlay")]
        public GameObject OverlayPanel;
        public TextMeshProUGUI OverlayTitle;
        public TextMeshProUGUI OverlayMessage;

        private PlayerController _player;
        private PersonalityManager _personality;
        private SanitySystem _sanity;
        private ClubSystem _club;
        private MissionSystem _missions;

        private void Start()
        {
            _player = FindObjectOfType<PlayerController>();
            _personality = FindObjectOfType<PersonalityManager>();
            _sanity = FindObjectOfType<SanitySystem>();
            _club = FindObjectOfType<ClubSystem>();
            _missions = FindObjectOfType<MissionSystem>();
            
            if (OverlayPanel != null) OverlayPanel.SetActive(false);
        }

        private void Update()
        {
            if (_player == null) return;

            SyncStatus();
        }

        private void SyncStatus()
        {
            if (SanityText != null)
            {
                SanityText.text = $"STABILITY: {_sanity.Tier}";
                SanityText.color = (_sanity.Tier == SanityTier.HALLUCINATING) ? Color.red : Color.white;
            }

            if (PersonalityText != null)
            {
                PersonalityText.text = $"MODE: {_personality.Mode}";
                PersonalityText.color = (_personality.Mode == PersonaMode.NARRATOR) ? new Color(0, 0.5f, 1f) : Color.red;
            }

            if (StaminaText != null)
            {
                StaminaText.text = $"VITALITY: {Mathf.Floor(_player.Stamina)}%";
            }

            if (ReputationText != null && _club != null)
            {
                ReputationText.text = $"REPUTATION: {_club.Reputation}";
            }

            if (HeatText != null && _club != null)
            {
                HeatText.text = $"POLICE HEAT: {Mathf.Floor(_club.PoliceAttention)}%";
                HeatText.color = (_club.PoliceAttention > 70f) ? Color.red : Color.white;
            }
        }

        public void ShowOverlay(string title, string message, bool isFailure = false)
        {
            if (OverlayPanel == null) return;

            OverlayPanel.SetActive(true);
            OverlayTitle.text = title;
            OverlayMessage.text = message;
            
            if (isFailure) OverlayTitle.color = Color.red;
            else OverlayTitle.color = Color.white;
        }

        public void HideOverlay()
        {
            if (OverlayPanel != null) OverlayPanel.SetActive(false);
        }
    }
}
