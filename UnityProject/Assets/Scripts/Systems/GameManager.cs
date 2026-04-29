using UnityEngine;
using System.Collections.Generic;
using ProjectMayhem.Player;
using ProjectMayhem.Combat;

namespace ProjectMayhem.Systems
{
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        [Header("Prefabs")]
        public GameObject EnemyPrefab;
        public GameObject SoapPrefab;

        [Header("Spawn Settings")]
        public Transform[] SpawnPoints;
        public float EnemySpawnRate = 5f;
        
        private float _spawnTimer;
        public List<GameObject> Enemies = new List<GameObject>();

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        private void Start()
        {
            SpawnInitialEntities();
        }

        private void Update()
        {
            HandleSpawning();
        }

        private void SpawnInitialEntities()
        {
            // Spawn iconic soap
            if (SoapPrefab != null)
            {
                Instantiate(SoapPrefab, new Vector3(0, 1, 0), Quaternion.identity);
            }

            // Initial enemies
            for (int i = 0; i < 2; i++)
            {
                SpawnEnemy();
            }
        }

        private void HandleSpawning()
        {
            _spawnTimer += Time.deltaTime;
            if (_spawnTimer >= EnemySpawnRate)
            {
                SpawnEnemy();
                _spawnTimer = 0;
            }
        }

        public void SpawnEnemy()
        {
            if (EnemyPrefab == null) return;

            Vector3 spawnPos = (SpawnPoints != null && SpawnPoints.Length > 0) 
                ? SpawnPoints[Random.Range(0, SpawnPoints.Length)].position 
                : new Vector3(Random.Range(-10, 10), 0, Random.Range(-10, 10));

            GameObject enemy = Instantiate(EnemyPrefab, spawnPos, Quaternion.identity);
            Enemies.Add(enemy);
        }

        public void OnEnemyDeath(GameObject enemy)
        {
            Enemies.Remove(enemy);
        }
    }
}
