using UnityEngine;
using ProjectMayhem;
using ProjectMayhem.Systems;

namespace ProjectMayhem.Systems
{
    public class PersonalityManager : MonoBehaviour
    {
        public PersonaMode Mode = PersonaMode.NARRATOR;
        public float SwitchCooldown = 0f;
        private float _forcedTimer = 0f;
        
        private SanitySystem _sanitySystem;

        private void Awake()
        {
            _sanitySystem = GetComponent<SanitySystem>();
        }

        private void Update()
        {
            if (SwitchCooldown > 0) SwitchCooldown -= Time.deltaTime;

            if (Input.GetKeyDown(KeyCode.Tab) && SwitchCooldown <= 0)
            {
                TogglePersona();
            }

            // Forced switching at low sanity
            if (_sanitySystem.Value < 30f)
            {
                _forcedTimer -= Time.deltaTime;
                if (_forcedTimer <= 0)
                {
                    TogglePersona();
                    _forcedTimer = 3f + Random.Range(0f, 5f);
                }
            }
            
            _sanitySystem.UpdateSanity(Time.deltaTime, Mode);
        }

        public void TogglePersona()
        {
            Mode = (Mode == PersonaMode.NARRATOR) ? PersonaMode.TYLER : PersonaMode.NARRATOR;
            SwitchCooldown = 1f; 
            
            _sanitySystem.Value -= 10f; // Personality switch takes a toll
            
            Debug.Log($"PERSONA SHIFT: {Mode}");
        }
    }
}
