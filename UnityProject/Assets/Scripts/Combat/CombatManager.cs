using UnityEngine;
using ProjectMayhem.Systems;
using System.Collections.Generic;

namespace ProjectMayhem.Combat
{
    public class CombatManager : MonoBehaviour
    {
        public static CombatManager Instance { get; private set; }

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        public void ResolveHit(Transform attacker, float range, float damage, LayerMask targetLayer)
        {
            Collider[] hitColliders = Physics.OverlapSphere(attacker.position + attacker.forward, range, targetLayer);
            foreach (var hitCollider in hitColliders)
            {
                if (hitCollider.TryGetComponent<IDamageable>(out var damageable))
                {
                    damageable.TakeDamage(damage);
                    // Visual feedback
                    FindObjectOfType<CameraFollow>()?.Shake(0.3f);
                    Debug.Log($"Hit {hitCollider.name} for {damage} damage!");
                }
            }
        }
    }
}
