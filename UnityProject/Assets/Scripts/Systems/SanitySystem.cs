using UnityEngine;
using ProjectMayhem;
using ProjectMayhem.Systems;

namespace ProjectMayhem.Systems
{
    public enum SanityTier
    {
        STABLE,
        GLITCHY,
        DISTORTED,
        HALLUCINATING
    }

    public class SanitySystem : MonoBehaviour
    {
        public float Value = 100f;
        public SanityTier Tier = SanityTier.STABLE;
        
        [Header("Settings")]
        public float ChaosDrainRate = 10f; // per second
        public float RationalRecoveryRate = 2f; // per second

        public void UpdateSanity(float deltaTime, PersonaMode mode)
        {
            if (mode == PersonaMode.CHAOS)
            {
                Value -= ChaosDrainRate * deltaTime;
            }
            else
            {
                Value += RationalRecoveryRate * deltaTime;
            }

            Value = Mathf.Clamp(Value, 0f, 100f);

            UpdateTier();
        }

        private void UpdateTier()
        {
            if (Value > 70f) Tier = SanityTier.STABLE;
            else if (Value > 40f) Tier = SanityTier.GLITCHY;
            else if (Value > 10f) Tier = SanityTier.DISTORTED;
            else Tier = SanityTier.HALLUCINATING;
        }

        public (float distortion, float flicker, float delay) GetEffects()
        {
            return (
                Value < 40f ? 5f : 0f,
                Value < 10f ? 0.2f : 0f,
                Value < 40f ? 0.1f : 0f // Delay in seconds
            );
        }
    }
}
