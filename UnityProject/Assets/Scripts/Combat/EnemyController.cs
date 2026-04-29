using UnityEngine;
using ProjectMayhem;
using ProjectMayhem.Combat;
using ProjectMayhem.Systems;

namespace ProjectMayhem.Combat
{
    public enum EnemyState
    {
        IDLE,
        FOLLOW,
        ATTACK,
        STUNNED
    }

    [RequireComponent(typeof(Rigidbody))]
    public class EnemyController : MonoBehaviour, IDamageable
    {
        [Header("Stats")]
        public float Health = 100f;
        public float FollowRange = 10f;
        public float AttackRange = 2f;
        public float MoveSpeed = 5f;
        public float AttackCooldown = 1.5f;

        private Rigidbody _rb;
        private Transform _player;
        private SanitySystem _sanity;
        private EnemyState _state = EnemyState.IDLE;
        private float _stunTimer = 0f;
        private float _currentAttackCooldown = 0f;

        private void Awake()
        {
            _rb = GetComponent<Rigidbody>();
            _player = GameObject.FindGameObjectWithTag("Player")?.transform;
            if (_player != null) _sanity = _player.GetComponent<SanitySystem>();
        }

        private void Update()
        {
            if (_stunTimer > 0)
            {
                _stunTimer -= Time.deltaTime;
                _state = EnemyState.STUNNED;
                return;
            }

            if (_player == null) return;

            float distance = Vector3.Distance(transform.position, _player.position);

            if (distance > FollowRange)
            {
                _state = EnemyState.IDLE;
            }
            else if (distance > AttackRange)
            {
                _state = EnemyState.FOLLOW;
                MoveTowardsPlayer();
            }
            else
            {
                _state = EnemyState.ATTACK;
                TryAttack();
            }

            if (_currentAttackCooldown > 0) _currentAttackCooldown -= Time.deltaTime;
        }

        private void MoveTowardsPlayer()
        {
            Vector3 direction = (_player.position - transform.position).normalized;
            direction.y = 0;
            _rb.linearVelocity = direction * MoveSpeed;
            transform.forward = direction;
        }

        private void TryAttack()
        {
            if (_currentAttackCooldown <= 0)
            {
                Debug.Log($"{name} ATTACKS!");
                // Trigger attack logic (ResolveHit)
                CombatManager.Instance.ResolveHit(transform, AttackRange, 10f, LayerMask.GetMask("Player"));
                
                if (_sanity != null) _sanity.Value -= 5f;
                
                _currentAttackCooldown = AttackCooldown;
            }
        }

        public void TakeDamage(float amount)
        {
            Health -= amount;
            _stunTimer = 0.5f;
            _rb.linearVelocity = Vector3.zero;
            Debug.Log($"{name} took {amount} damage! Health: {Health}");
            
            if (Health <= 0) Die();
        }

        private void Die()
        {
            Debug.Log($"{name} DIED.");
            Destroy(gameObject);
        }
    }
}
