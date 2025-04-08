// Função para formatar a data
function formatarData(dataGMT) {
  const data = new Date(dataGMT);
  const dia = String(data.getUTCDate()).padStart(2, "0");
  const mes = String(data.getUTCMonth() + 1).padStart(2, "0");
  const ano = data.getUTCFullYear();
  const horas = String(data.getUTCHours()).padStart(2, "0");
  const minutos = String(data.getUTCMinutes()).padStart(2, "0");
  const segundos = String(data.getUTCSeconds()).padStart(2, "0");
  return `${dia}/${mes}/${ano} ${horas}:${minutos}:${segundos}`;
}

// Função para buscar e listar os arquivos cadastrados
function listarArquivos() {
  fetch("http://localhost:5000/documento/listar")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Erro ao buscar arquivos.");
      }
      return response.json();
    })
    .then((data) => {
      atualizarTabela(data);
    })
    .catch((error) => {
      console.error("Erro:", error);
      alert("Erro ao carregar a lista de arquivos.");
    });
}

// Formata o campo cpf do modal Assinar PDF
document.getElementById("cpf").addEventListener("input", function () {
  let cpf = this.value.replace(/\D/g, ""); // Remove tudo que não for número

  // Aplica a máscara: XXX.XXX.XXX-XX
  if (cpf.length > 3) cpf = cpf.replace(/^(\d{3})(\d)/, "$1.$2");
  if (cpf.length > 6) cpf = cpf.replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3");
  if (cpf.length > 9)
    cpf = cpf.replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");

  this.value = cpf;
});

// Função para atualizar a tabela
function atualizarTabela(arquivos) {
  const tbody = document.querySelector(".table tbody");
  tbody.innerHTML = "";

  arquivos.documentos.forEach((arquivo) => {
    const dataFormatada = formatarData(arquivo.data_envio);
    const statusAssinatura = arquivo.status_assinatura
      ? "Assinado"
      : "Pendente";
    const desabilitarAssinar = arquivo.status_assinatura ? "disabled" : "";
    const row = `
          <tr>
              <td>${arquivo.id}</td>
              <td>${arquivo.nome_arquivo}</td>
              <td>${dataFormatada}</td>
              <td>${statusAssinatura}</td>
              <td>
                  <div class="dropdown">
                      <button class="dropdown-toggle-custom" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                          <i class="bi bi-three-dots-vertical"></i>
                      </button>
                      <ul class="dropdown-menu">
                          <li>
                              <a class="dropdown-item" href="#" onclick="abrirModalEditar(${arquivo.id}, '${arquivo.nome_arquivo}')">
                                  <i class="bi bi-pencil"></i> Editar
                              </a>
                          </li>
                          <li>
                              <a class="dropdown-item" href="#" onclick="removerArquivo(${arquivo.id})">
                                  <i class="bi bi-trash"></i> Remover
                              </a>
                          </li>
                          <li>
                              <a class="dropdown-item ${desabilitarAssinar}" href="#" onclick="abrirModalAssinar(${arquivo.id})">
                                  <i class="bi bi-file-earmark-text"></i> Assinar
                              </a>
                          </li>
                           <li>
                              <a class="dropdown-item" href="#" onclick="downloadArquivo(${arquivo.id})">
                                  <i class="bi bi-download"></i> Download
                              </a>
                          </li>
                      </ul>
                  </div>
              </td>
          </tr>
      `;
    tbody.insertAdjacentHTML("beforeend", row);
  });
}

// Função para abrir o modal de edição
function abrirModalEditar(id, nome) {
  document.getElementById("idArquivoEditar").value = id;
  document.getElementById("nomeArquivoEditar").value = nome;
  new bootstrap.Modal(document.getElementById("modalEditar")).show();
}

//Função para editar um arquivo
document
  .getElementById("formEditar")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    const id = document.getElementById("idArquivoEditar").value;
    const novoNome = document.getElementById("nomeArquivoEditar").value;
    const arquivo = document.getElementById("uploadArquivoEditar").files[0];

    const formData = new FormData();
    formData.append("nome_arquivo", novoNome);
    formData.append("pdf_data", arquivo);
    formData.append("status_assinatura", "False");

    fetch(`http://localhost:5000/documento/editar?id_documento=${id}`, {
      method: "PUT",
      body: formData,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erro ao editar o arquivo.");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Arquivo editado:", data);
        alert("Arquivo editado com sucesso!");
        listarArquivos();
      })
      .catch((error) => {
        console.error("Erro:", error);
        alert("Erro ao editar o arquivo.");
      })
      .finally(() => {
        const modal = bootstrap.Modal.getInstance(
          document.getElementById("modalEditar")
        );
        modal.hide();
      });
  });

function downloadArquivo(id) {
  window.location.href = `http://localhost:5000/documento/download?documento_id=${id}`;
}

// Abrir modal assinatura
function abrirModalAssinar(id) {
  document.getElementById("idArquivoAssinar").value = id;

  new bootstrap.Modal(document.getElementById("modalAssinar")).show();
}

// Função para assinar documento
document
  .getElementById("formAssinar")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    const id = document.getElementById("idArquivoAssinar").value;
    const nome = document.getElementById("nome").value;
    const cpf = document.getElementById("cpf").value;

    const cpfLimpo = cpf.replace(/\D/g, "");

    fetch(`http://localhost:5000/assinatura/cadastrar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id_documento: id,
        nome: nome,
        cpf: cpfLimpo,
        status_assinatura: "True",
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erro ao assinar o arquivo.");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Arquivo assinado:", data);
        alert("Arquivo assinado com sucesso!");
        listarArquivos();
      })
      .catch((error) => {
        console.error("Erro:", error);
        alert("Erro ao assinar o arquivo.");
      })
      .finally(() => {
        const modal = bootstrap.Modal.getInstance(
          document.getElementById("modalAssinar")
        );
        modal.hide();
      });
  });

// Carrega a lista de arquivos ao carregar a página
document.addEventListener("DOMContentLoaded", listarArquivos);

// Função para remover um arquivo
function removerArquivo(id) {
  if (confirm("Tem certeza que deseja remover este arquivo?")) {
    fetch(`http://localhost:5000/documento/deletar?documento_id=${id}`, {
      method: "DELETE",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erro ao remover o arquivo.");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Arquivo removido:", data);
        alert("Arquivo removido com sucesso!");
        listarArquivos();
      })
      .catch((error) => {
        console.error("Erro:", error);
        alert("Erro ao remover o arquivo.");
      });
  }
}

// Função para enviar o formulário de cadastro
document
  .getElementById("formCadastrar")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    const nomeArquivo = document.getElementById("nomeArquivo").value;
    const arquivo = document.getElementById("uploadArquivo").files[0];

    if (!arquivo) {
      alert("Por favor, selecione um arquivo.");
      return;
    }

    const formData = new FormData();
    formData.append("nome_arquivo", nomeArquivo);
    formData.append("pdf_data", arquivo);
    formData.append("status_assinatura", "False");

    fetch("http://localhost:5000/documento/cadastrar", {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erro na requisição: " + response.statusText);
        }
        return response.json();
      })
      .then((data) => {
        console.log("Resposta do servidor:", data);
        alert("Arquivo enviado com sucesso!");
        listarArquivos();
      })
      .catch((error) => {
        console.error("Erro:", error);
        alert("Erro ao enviar o arquivo. Tente novamente.");
      })
      .finally(() => {
        const modal = bootstrap.Modal.getInstance(
          document.getElementById("modalCadastrar")
        );
        modal.hide();
        document.getElementById("formCadastrar").reset();
      });
  });

// Carrega a lista de arquivos ao carregar a página
document.addEventListener("DOMContentLoaded", listarArquivos);
