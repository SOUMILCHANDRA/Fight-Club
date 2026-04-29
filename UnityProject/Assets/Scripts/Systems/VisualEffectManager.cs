using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;
using ProjectMayhem.Systems;

namespace ProjectMayhem.Visuals
{
    public class VisualEffectManager : MonoBehaviour
    {
        public Volume PostProcessVolume;
        private ColorAdjustments _colorAdjustments;
        private Vignette _vignette;
        private ChromaticAberration _chromaticAberration;
        private LensDistortion _lensDistortion;

        private PersonalityManager _personality;
        private SanitySystem _sanity;

        private void Start()
        {
            PostProcessVolume.profile.TryGet(out _colorAdjustments);
            PostProcessVolume.profile.TryGet(out _vignette);
            PostProcessVolume.profile.TryGet(out _chromaticAberration);
            PostProcessVolume.profile.TryGet(out _lensDistortion);

            _personality = FindObjectOfType<PersonalityManager>();
            _sanity = FindObjectOfType<SanitySystem>();
        }

        private void Update()
        {
            ApplyPersonaVisuals();
            ApplySanityVisuals();
        }

        private void ApplyPersonaVisuals()
        {
            if (_colorAdjustments == null) return;

            Color targetColor = (_personality.Mode == PersonaMode.TYLER) ? new Color(1f, 0.4f, 0.4f) : Color.white;
            _colorAdjustments.colorFilter.Interp(_colorAdjustments.colorFilter.value, targetColor, Time.deltaTime * 5f);
            
            float targetSaturation = (_personality.Mode == PersonaMode.TYLER) ? 50f : 0f;
            _colorAdjustments.saturation.Interp(_colorAdjustments.saturation.value, targetSaturation, Time.deltaTime * 5f);
        }

        private void ApplySanityVisuals()
        {
            if (_sanity == null) return;

            var effects = _sanity.GetEffects();

            if (_lensDistortion != null)
                _lensDistortion.intensity.Interp(_lensDistortion.intensity.value, effects.distortion * -0.1f, Time.deltaTime * 2f);

            if (_chromaticAberration != null)
                _chromaticAberration.intensity.Interp(_chromaticAberration.intensity.value, effects.distortion * 0.2f, Time.deltaTime * 2f);

            if (_vignette != null)
            {
                float targetVignette = (_sanity.Value < 30f) ? 0.5f : 0.3f;
                _vignette.intensity.Interp(_vignette.intensity.value, targetVignette, Time.deltaTime * 2f);
            }
        }
    }
}
