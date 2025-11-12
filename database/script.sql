/* ======================================================================
   ROTISSERIE ISRAEL — SCRIPT DE BANCO (MySQL/MariaDB)
   Fidelidade ao MER + comentários didáticos
   ----------------------------------------------------------------------
   Tabelas:
     - clientes
     - produtos
     - cardapio
     - pedidos
     - itens_pedido  (tabela ponte N:N entre pedidos e cardapio)
   ====================================================================== */

-- ======================================================================
-- [0] Ambiente local de aula — recria o BD do zero
-- ======================================================================
DROP DATABASE IF EXISTS rotisserie_db;
CREATE DATABASE rotisserie_db CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE rotisserie_db;

-- ======================================================================
-- [1] CLIENTES  (MER: entidade "Cliente")
--   id_cliente (PK), nome, email (login/OAuth), senha_hash (opcional), num_whats
-- ======================================================================
CREATE TABLE clientes (
  id_cliente INT PRIMARY KEY AUTO_INCREMENT,
  nome       VARCHAR(120) NOT NULL,
  email      VARCHAR(150) NOT NULL UNIQUE,  -- mapeia "login" do MER (usaremos com Google OAuth)
  senha_hash VARCHAR(255) NULL,             -- se quiser login tradicional paralelo
  num_whats  VARCHAR(30)  NULL,
  criado_em  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ======================================================================
-- [2] PRODUTOS  (MER: entidade "Produtos")
--   Catálogo base: nome_produto, descricao
--   Observação: no MER, "Cardápio Tem Produtos" → FK em cardapio
-- ======================================================================
CREATE TABLE produtos (
  id_produto   INT PRIMARY KEY AUTO_INCREMENT,
  nome_produto VARCHAR(120) NOT NULL,
  descricao    VARCHAR(255) NULL
) ENGINE=InnoDB;

-- ======================================================================
-- [3] CARDÁPIO  (MER: entidade "Cardápio")
--   Itens vendáveis + preço + categoria
--   FK: id_produto → produtos
--   Campo extra "disponivel" (didático): facilita esconder/mostrar itens
-- ======================================================================
CREATE TABLE cardapio (
  id_item     INT PRIMARY KEY AUTO_INCREMENT,
  id_produto  INT NOT NULL,
  categoria   VARCHAR(60) NOT NULL,
  preco       DECIMAL(10,2) NOT NULL,
  disponivel  TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT fk_cardapio_produto
    FOREIGN KEY (id_produto) REFERENCES produtos(id_produto)
) ENGINE=InnoDB;

-- Index úteis (consultas por categoria/disponível)
CREATE INDEX idx_cardapio_categoria   ON cardapio (categoria);
CREATE INDEX idx_cardapio_disponivel  ON cardapio (disponivel);

-- ======================================================================
-- [4] PEDIDOS  (MER: entidade "Pedido")
--   Cliente Faz Pedido → FK id_cliente (NOT NULL)
--   Endereço simples (rua, num_casa, bairro), data, status, valor_total
--   "status" como ENUM padroniza estado do pedido (melhoria didática)
-- ======================================================================
CREATE TABLE pedidos (
  id_pedido   INT PRIMARY KEY AUTO_INCREMENT,
  id_cliente  INT NOT NULL,
  rua         VARCHAR(120) NULL,
  num_casa    VARCHAR(10)  NULL,
  bairro      VARCHAR(80)  NULL,
  data_pedido DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status      ENUM('ABERTO','EM_PREPARO','SAIU_P_ENTREGA','FINALIZADO','CANCELADO')
              NOT NULL DEFAULT 'ABERTO',
  valor_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  CONSTRAINT fk_pedido_cliente
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente)
) ENGINE=InnoDB;

CREATE INDEX idx_pedidos_cliente ON pedidos (id_cliente);
CREATE INDEX idx_pedidos_status  ON pedidos (status);

-- ======================================================================
-- [5] ITENS_PEDIDO  (MER: relacionamento "itemPedido")
--   N:N entre Pedido e Cardápio
--   PK composta (id_pedido, id_item)
--   Guarda "preco" praticado no momento do pedido (histórico de preço)
-- ======================================================================
CREATE TABLE itens_pedido (
  id_pedido INT NOT NULL,
  id_item   INT NOT NULL,
  qtd       INT NOT NULL DEFAULT 1,
  preco     DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (id_pedido, id_item),
  CONSTRAINT fk_item_pedido
    FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido)
      ON DELETE CASCADE,
  CONSTRAINT fk_item_cardapio
    FOREIGN KEY (id_item)   REFERENCES cardapio(id_item)
) ENGINE=InnoDB;

-- ======================================================================
-- [6] DADOS INICIAIS BÁSICOS (4 itens) — robustos (sem depender de ID)
-- ======================================================================
INSERT INTO produtos (nome_produto, descricao) VALUES
  ('Esfiha de Carne', 'Massa caseira, recheio artesanal'),
  ('Quibe Assado',    'Tradição que derrete na boca'),
  ('Tabule',          'Fresco, leve e saboroso'),
  ('Homus',           'Pasta de grão-de-bico');

-- vincula ao cardápio usando SELECT do id pelo nome (não usa IDs fixos)
INSERT INTO cardapio (id_produto, categoria, preco, disponivel)
VALUES
((SELECT id_produto FROM produtos WHERE nome_produto='Esfiha de Carne'),'Salgados',6.50,1),
((SELECT id_produto FROM produtos WHERE nome_produto='Quibe Assado'),'Salgados',8.00,1),
((SELECT id_produto FROM produtos WHERE nome_produto='Tabule'),'Saladas',18.00,1),
((SELECT id_produto FROM produtos WHERE nome_produto='Homus'),'Pastas',16.00,1);

-- Mensagem de sucesso (aparece no phpMyAdmin)
SELECT 'Banco de dados criado com sucesso!' AS status;

-- ======================================================================
-- [7] SEED SEGURO (grande) — itens típicos de rotisserie
--     • INSERT IGNORE para não duplicar se rodar novamente
--     • Transação para consistência
-- ======================================================================
USE rotisserie_db;

START TRANSACTION;

-- Produtos (um por linha; IGNORE evita duplicar)
INSERT IGNORE INTO produtos (nome_produto, descricao) VALUES ('Esfiha de Frango','Frango desfiado temperado');
INSERT IGNORE INTO produtos (nome_produto, descricao) VALUES ('Esfiha de Queijo','Queijo cremoso');
INSERT IGNORE INTO produtos (nome_produto, descricao) VALUES ('Esfiha de Calabresa','Calabresa acebolada');
INSERT IGNORE INTO produtos (nome_produto, descricao) VALUES ('Esfiha de Chocolate','Doce com creme de chocolate');

INSERT IGNORE INTO produtos (nome_produto, descricao) VALUES ('Quibe Frito','Quibe tradicional frito');
INSERT IGNORE INTO produtos (nome_produto, descricao) VALUES ('Kafta Assada','Espetinho de carne moída temperada');

INSERT IGNORE INTO produtos (nome_produto, descricao) VALUES ('Frango Assado Inteiro','Frango crocante na brasa');
INSERT IGNORE INTO produtos (nome_produto, descricao) VALUES ('Meio Frango Assado','Porção ideal para 2');
INSERT IGNORE INTO produtos (nome_produto, descricao) VALUES ('Pernil Assado','Pernil suíno ao forno');
INSERT IGNORE INTO produtos (nome_produto, descricao) VALUES ('Costela Bovina Assada','Costela lentamente assada');
INSERT IGNORE INTO produtos (nome_produto, descricao) VALUES ('Batata Assada Rústica','Batatas em gomos com ervas');

INSERT IGNORE INTO produtos (nome_produto, descricao) VALUES ('Arroz Branco','Arroz soltinho');
INSERT IGNORE INTO produtos (nome_produto, descricao) VALUES ('Arroz à Grega','Arroz com legumes coloridos');
INSERT IGNORE INTO produtos (nome_produto, descricao) VALUES ('Farofa Crocante','Farofa de manteiga e bacon');
INSERT IGNORE INTO produtos (nome_produto, descricao) VALUES ('Maionese de Batata','Clássica de rotisserie');
INSERT IGNORE INTO produtos (nome_produto, descricao) VALUES ('Salpicão de Frango','Frango, cenoura e uvas-passas');
INSERT IGNORE INTO produtos (nome_produto, descricao) VALUES ('Feijão Carioca','Feijão caseiro');
INSERT IGNORE INTO produtos (nome_produto, descricao) VALUES ('Vinagrete','Tomate, cebola e pimentão');

INSERT IGNORE INTO produtos (nome_produto, descricao) VALUES ('Coalhada Seca','Iogurte denso temperado');
INSERT IGNORE INTO produtos (nome_produto, descricao) VALUES ('Babaganuche','Pasta de berinjela defumada');
INSERT IGNORE INTO produtos (nome_produto, descricao) VALUES ('Tabule Família','Porção grande de tabule');
INSERT IGNORE INTO produtos (nome_produto, descricao) VALUES ('Fatuche','Salada árabe com pão sírio crocante');

INSERT IGNORE INTO produtos (nome_produto, descricao) VALUES ('Lasanha à Bolonhesa','Porção individual');
INSERT IGNORE INTO produtos (nome_produto, descricao) VALUES ('Lasanha de Frango','Com molho branco');
INSERT IGNORE INTO produtos (nome_produto, descricao) VALUES ('Macarrão Alho e Óleo','Clássico com alho dourado');

INSERT IGNORE INTO produtos (nome_produto, descricao) VALUES ('Pão Sírio','Unidade');
INSERT IGNORE INTO produtos (nome_produto, descricao) VALUES ('Molho Tahine','Base de gergelim');
INSERT IGNORE INTO produtos (nome_produto, descricao) VALUES ('Molho Alho','Cremoso de alho');

INSERT IGNORE INTO produtos (nome_produto, descricao) VALUES ('Refrigerante Lata','Lata 350ml — sabores variados');
INSERT IGNORE INTO produtos (nome_produto, descricao) VALUES ('Suco Natural 300ml','Sabores do dia');
INSERT IGNORE INTO produtos (nome_produto, descricao) VALUES ('Água Mineral 500ml','Sem gás');

INSERT IGNORE INTO produtos (nome_produto, descricao) VALUES ('Baklava','Folhado com nozes e mel');
INSERT IGNORE INTO produtos (nome_produto, descricao) VALUES ('Malabi','Manjar de leite com calda de rosas');
INSERT IGNORE INTO produtos (nome_produto, descricao) VALUES ('Pudim de Leite','Tradicional com calda de caramelo');

-- Cardápio (SELECT pega o id do produto pelo nome) — com IGNORE
INSERT IGNORE INTO cardapio (id_produto, categoria, preco, disponivel)
VALUES ((SELECT id_produto FROM produtos WHERE nome_produto='Esfiha de Frango'),'Esfihas',6.00,1);
INSERT IGNORE INTO cardapio VALUES ((SELECT id_produto FROM produtos WHERE nome_produto='Esfiha de Queijo'),'Esfihas',6.00,1);
INSERT IGNORE INTO cardapio VALUES ((SELECT id_produto FROM produtos WHERE nome_produto='Esfiha de Calabresa'),'Esfihas',6.50,1);
INSERT IGNORE INTO cardapio VALUES ((SELECT id_produto FROM produtos WHERE nome_produto='Esfiha de Chocolate'),'Esfihas',7.00,1);

INSERT IGNORE INTO cardapio VALUES ((SELECT id_produto FROM produtos WHERE nome_produto='Quibe Frito'),'Kibes & Kaftas',7.50,1);
INSERT IGNORE INTO cardapio VALUES ((SELECT id_produto FROM produtos WHERE nome_produto='Kafta Assada'),'Kibes & Kaftas',10.00,1);

INSERT IGNORE INTO cardapio VALUES ((SELECT id_produto FROM produtos WHERE nome_produto='Frango Assado Inteiro'),'Assados',49.90,1);
INSERT IGNORE INTO cardapio VALUES ((SELECT id_produto FROM produtos WHERE nome_produto='Meio Frango Assado'),'Assados',29.90,1);
INSERT IGNORE INTO cardapio VALUES ((SELECT id_produto FROM produtos WHERE nome_produto='Pernil Assado'),'Assados',69.90,1);
INSERT IGNORE INTO cardapio VALUES ((SELECT id_produto FROM produtos WHERE nome_produto='Costela Bovina Assada'),'Assados',89.90,1);
INSERT IGNORE INTO cardapio VALUES ((SELECT id_produto FROM produtos WHERE nome_produto='Batata Assada Rústica'),'Acompanhamentos',18.00,1);

INSERT IGNORE INTO cardapio VALUES ((SELECT id_produto FROM produtos WHERE nome_produto='Arroz Branco'),'Acompanhamentos',12.00,1);
INSERT IGNORE INTO cardapio VALUES ((SELECT id_produto FROM produtos WHERE nome_produto='Arroz à Grega'),'Acompanhamentos',16.00,1);
INSERT IGNORE INTO cardapio VALUES ((SELECT id_produto FROM produtos WHERE nome_produto='Farofa Crocante'),'Acompanhamentos',14.00,1);
INSERT IGNORE INTO cardapio VALUES ((SELECT id_produto FROM produtos WHERE nome_produto='Maionese de Batata'),'Acompanhamentos',18.00,1);
INSERT IGNORE INTO cardapio VALUES ((SELECT id_produto FROM produtos WHERE nome_produto='Salpicão de Frango'),'Acompanhamentos',22.00,1);
INSERT IGNORE INTO cardapio VALUES ((SELECT id_produto FROM produtos WHERE nome_produto='Feijão Carioca'),'Acompanhamentos',12.00,1);
INSERT IGNORE INTO cardapio VALUES ((SELECT id_produto FROM produtos WHERE nome_produto='Vinagrete'),'Saladas',10.00,1);

INSERT IGNORE INTO cardapio VALUES ((SELECT id_produto FROM produtos WHERE nome_produto='Coalhada Seca'),'Pastas',22.00,1);
INSERT IGNORE INTO cardapio VALUES ((SELECT id_produto FROM produtos WHERE nome_produto='Babaganuche'),'Pastas',22.00,1);
INSERT IGNORE INTO cardapio VALUES ((SELECT id_produto FROM produtos WHERE nome_produto='Tabule Família'),'Saladas',28.00,1);
INSERT IGNORE INTO cardapio VALUES ((SELECT id_produto FROM produtos WHERE nome_produto='Fatuche'),'Saladas',26.00,1);

INSERT IGNORE INTO cardapio VALUES ((SELECT id_produto FROM produtos WHERE nome_produto='Lasanha à Bolonhesa'),'Massas',32.00,1);
INSERT IGNORE INTO cardapio VALUES ((SELECT id_produto FROM produtos WHERE nome_produto='Lasanha de Frango'),'Massas',32.00,1);
INSERT IGNORE INTO cardapio VALUES ((SELECT id_produto FROM produtos WHERE nome_produto='Macarrão Alho e Óleo'),'Massas',22.00,1);

INSERT IGNORE INTO cardapio VALUES ((SELECT id_produto FROM produtos WHERE nome_produto='Pão Sírio'),'Pães',3.50,1);
INSERT IGNORE INTO cardapio VALUES ((SELECT id_produto FROM produtos WHERE nome_produto='Molho Tahine'),'Molhos',6.00,1);
INSERT IGNORE INTO cardapio VALUES ((SELECT id_produto FROM produtos WHERE nome_produto='Molho Alho'),'Molhos',5.00,1);

INSERT IGNORE INTO cardapio VALUES ((SELECT id_produto FROM produtos WHERE nome_produto='Refrigerante Lata'),'Bebidas',6.00,1);
INSERT IGNORE INTO cardapio VALUES ((SELECT id_produto FROM produtos WHERE nome_produto='Suco Natural 300ml'),'Bebidas',8.00,1);
INSERT IGNORE INTO cardapio VALUES ((SELECT id_produto FROM produtos WHERE nome_produto='Água Mineral 500ml'),'Bebidas',4.00,1);

INSERT IGNORE INTO cardapio VALUES ((SELECT id_produto FROM produtos WHERE nome_produto='Baklava'),'Sobremesas',12.00,1);
INSERT IGNORE INTO cardapio VALUES ((SELECT id_produto FROM produtos WHERE nome_produto='Malabi'),'Sobremesas',10.00,1);
INSERT IGNORE INTO cardapio VALUES ((SELECT id_produto FROM produtos WHERE nome_produto='Pudim de Leite'),'Sobremesas',12.00,1);

COMMIT;
